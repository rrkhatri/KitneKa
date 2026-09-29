/**
 * Search orchestration.
 *
 * Answers one question — "where is this product cheapest for me" — in this order:
 *
 *   1. Ask every platform for listings matching the query, in parallel, each
 *      through the adapter chain so one dead upstream cannot take down the
 *      comparison.
 *   2. Establish WHAT the product is:
 *        a. If the bundled catalogue recognises the query, use that record.
 *        b. Otherwise discover it from the platforms' own results by
 *           cross-platform consensus (see lib/match/consensus.ts). This is what
 *           lets the app compare any product rather than a fixed list.
 *   3. Match every listing back to that identity. A listing that is not
 *      confidently the same product is DROPPED, not shown with a low score.
 *   4. Resolve the pincode to the nearest serving dark store per platform.
 *   5. Build offers and sort cheapest-first.
 *
 * Steps 2-3 are pincode-independent by design: a national search and a pincode
 * search return the same price set and differ only in stock and ETA.
 */

import { DARK_STORES } from '@/data/darkStores';
import { TtlCache } from '@/lib/cache';
import { bestConsensus, canonicalFromCluster, type ConsensusCluster } from '@/lib/match/consensus';
import { AUTO_MATCH_THRESHOLD, matchTitles } from '@/lib/match/match';
import { findServiceabilityIn } from '@/lib/pincode/darkStore';
import { resolvePincode } from '@/lib/pincode/resolve';
import { PLATFORM_ORDER } from '@/lib/platforms';
import { darkStoresWithFallback, searchWithFallback, type Degradation } from '@/lib/providers/registry';
import { rankSeedCatalog } from '@/lib/providers/seed';
import type { PlatformListing, PlatformSearchResult } from '@/lib/providers/types';
import type { CanonicalProduct, DarkStore, Offer, PincodeLocation, PlatformId } from '@/lib/types';

export type ComparisonResult = {
  query: string;
  product: CanonicalProduct & { discovered?: boolean; platformCount?: number };
  offers: Offer[];
  location: PincodeLocation;
  /** Platforms searched but yielding nothing the shopper can actually buy. */
  unavailablePlatforms: { platform: PlatformId; reason: string }[];
  cheapest: Offer | null;
  /** What the spread between cheapest and dearest costs the shopper. */
  spreadPaise: number;
  degradations: Degradation[];
  /** True when every offer came from the bundled catalogue, not a live feed. */
  allSeed: boolean;
  /** How the product identity was established. Surfaced in the UI. */
  identitySource: 'catalogue' | 'consensus';
};

const listingCache = new TtlCache(500, 45_000, 10 * 60_000);
const storeCache = new TtlCache(50, 5 * 60_000, 60 * 60_000);

/**
 * How well the query must match a curated record before that record is trusted
 * as the product identity. Below this, cross-platform consensus decides instead.
 */
const CATALOGUE_TRUST = 0.75;

export function getCaches() {
  return { listingCache, storeCache };
}

type PlatformPayload = {
  platform: PlatformId;
  search: PlatformSearchResult | null;
  stores: DarkStore[] | null;
  degradations: Degradation[];
};

async function loadPlatform(
  platform: PlatformId,
  query: string,
  location: PincodeLocation,
  signal: AbortSignal | undefined,
): Promise<PlatformPayload> {
  const pincode = location.resolved ? location.pincode : '';
  const degradations: Degradation[] = [];

  // The cache wraps whatever the loader returns, and the loader returns a
  // ChainResult, so each arm unwraps twice: cache -> chain -> payload.
  const [chain, storeChain] = await Promise.all([
    listingCache
      .wrap(`listings:${platform}:${query.toLowerCase()}:${pincode}`, () =>
        searchWithFallback(platform, { query, pincode: pincode || null, signal }),
      )
      .then((r) => r.value)
      .catch((err: unknown) => {
        degradations.push({
          platform,
          adapter: 'all',
          kind: 'unavailable',
          message: err instanceof Error ? err.message : String(err),
          servedBy: 'none',
        });
        return null;
      }),
    storeCache
      .wrap(`stores:${platform}`, () => darkStoresWithFallback(platform))
      .then((r) => r.value)
      .catch(() => null),
  ]);

  const search = chain ? chain.value : null;
  if (chain) degradations.push(...chain.degradations);

  const stores = storeChain ? storeChain.value : null;
  if (storeChain) degradations.push(...storeChain.degradations);

  return { platform, search, stores, degradations };
}

/** The best listing on a platform for a given identity, or null if none match. */
function bestMatch(identity: string, listings: PlatformListing[]) {
  let best: { listing: PlatformListing; score: number } | null = null;

  for (const listing of listings) {
    const r = matchTitles(identity, listing.title);
    if (r.packMismatch || r.score < AUTO_MATCH_THRESHOLD) continue;
    if (!best || r.score > best.score) best = { listing, score: r.score };
  }

  return best;
}

export type SearchOptions = {
  pincode?: string | null;
  signal?: AbortSignal;
};

export async function compareProduct(
  query: string,
  options: SearchOptions = {},
): Promise<ComparisonResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const location = resolvePincode(options.pincode ?? '');

  const payloads = await Promise.all(
    PLATFORM_ORDER.map((platform) => loadPlatform(platform, trimmed, location, options.signal)),
  );

  const degradations: Degradation[] = [];
  const allResults: { platform: PlatformId; listings: PlatformListing[] }[] = [];
  for (const p of payloads) {
    degradations.push(...p.degradations);
    if (p.search) allResults.push({ platform: p.platform, listings: p.search.listings });
  }

  // Nothing came back from anywhere: there is genuinely no product to compare.
  if (allResults.length === 0 || allResults.every((r) => r.listings.length === 0)) {
    return null;
  }

  // ── Establish product identity ───────────────────────────────────────────
  // A curated record is more reliable than anything inferred, but only when
  // the query actually matches it. A loose catalogue hit is worse than none:
  // it would attach a confident-looking price table to the wrong product, so
  // anything below CATALOGUE_TRUST is discarded in favour of what the
  // platforms themselves agree on.
  const catalogueHit = rankSeedCatalog(trimmed)[0] ?? null;
  const trustCatalogue = catalogueHit !== null && catalogueHit.relevance >= CATALOGUE_TRUST;
  const cluster: ConsensusCluster | null = bestConsensus(allResults);

  let identity: ComparisonResult['product'];
  let identitySource: ComparisonResult['identitySource'];

  if (trustCatalogue && catalogueHit) {
    // Carries the category and curated metadata the consensus cannot know.
    identity = catalogueHit.product;
    identitySource = 'catalogue';
  } else if (cluster) {
    identity = canonicalFromCluster(cluster, trimmed);
    identitySource = 'consensus';
  } else {
    return null;
  }

  // When the catalogue recognised the query we still prefer the live listings,
  // but only those that match the curated identity.
  const matchTarget = identitySource === 'catalogue' ? identity.name : cluster!.representativeTitle;

  const offers: Offer[] = [];
  const unavailablePlatforms: { platform: PlatformId; reason: string }[] = [];

  for (const payload of payloads) {
    const { platform, search, stores: platformStores } = payload;

    if (!search) {
      unavailablePlatforms.push({
        platform,
        reason: 'Could not reach this platform right now.',
      });
      continue;
    }

    const match = bestMatch(matchTarget, search.listings);
    if (!match) {
      unavailablePlatforms.push({
        platform,
        reason: 'No listing confidently matched to this product.',
      });
      continue;
    }

    const stores = platformStores ?? DARK_STORES.filter((s) => s.platform === platform);
    const serviceability = findServiceabilityIn(stores, platform, location);
    const { listing } = match;

    const inStock = listing.inStock && serviceability.serviceable;

    if (!inStock) {
      unavailablePlatforms.push({
        platform,
        reason: !serviceability.serviceable
          ? (serviceability.reason ?? 'Not deliverable to this pincode.')
          : 'Currently out of stock.',
      });
    }

    offers.push({
      platform,
      platformProductId: listing.platformProductId,
      title: listing.title,
      imageUrl: listing.imageUrl ?? identity.imageUrl,
      listedPackSize: listing.packSize ?? identity.packSize,
      mrpPaise: listing.mrpPaise,
      pricePaise: listing.pricePaise,
      inStock,
      etaMinutes: serviceability.etaMinutes ?? listing.etaMinutes ?? 0,
      darkStoreId: serviceability.darkStore?.id ?? '',
      promoLabels: listing.promoLabels ?? [],
      observedAt: search.fetchedAt,
      matchConfidence: match.score,
      source: search.source,
    });
  }

  const sorted = sortOffers(offers);
  const buyable = sorted.filter((o) => o.inStock);
  const cheapest = buyable[0] ?? null;
  const dearest = buyable[buyable.length - 1] ?? null;

  const unavailableByPlatform = new Map(unavailablePlatforms.map((u) => [u.platform, u.reason]));

  return {
    query: trimmed,
    product: identity,
    offers: sorted,
    location,
    unavailablePlatforms: [...unavailableByPlatform.entries()]
      .filter(([platform]) => !sorted.some((o) => o.platform === platform && o.inStock))
      .map(([platform, reason]) => ({ platform, reason })),
    cheapest,
    spreadPaise: cheapest && dearest && cheapest !== dearest ? dearest.pricePaise - cheapest.pricePaise : 0,
    degradations,
    allSeed: sorted.length > 0 && sorted.every((o) => o.source === 'seed'),
    identitySource,
  };
}

/**
 * Cheapest first — the entire point of the product.
 *
 * Out-of-stock offers are pushed to the bottom rather than hidden, because
 * "cheapest but unavailable" is information: it tells the shopper whether the
 * saving is worth switching platform or just waiting an hour. Ties break on
 * delivery speed, the next thing a shopper weighs.
 */
export function sortOffers(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.pricePaise !== b.pricePaise) return a.pricePaise - b.pricePaise;
    return a.etaMinutes - b.etaMinutes;
  });
}
