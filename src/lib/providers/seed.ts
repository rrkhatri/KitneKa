/**
 * Seed adapter — the always-available baseline.
 *
 * Backed by the authored catalogue in `src/data/catalog.ts`. It never fails, so
 * the app is fully functional with zero external configuration, and every other
 * adapter in the chain can fail without taking the product down.
 *
 * Offers it returns are tagged `source: 'seed'` so the UI can label them and the
 * user is never misled into thinking a reference price is a live quote.
 */

import { SEED_CATALOG, type SeedProduct } from '@/data/catalog';
import { DARK_STORES } from '@/data/darkStores';
import type { DarkStore, PlatformId } from '@/lib/types';
import type { PlatformListing, PlatformSearchResult, ProviderAdapter, SearchContext } from './types';

/** 0..1 relevance of a catalogue product to the user's query. */
export function scoreSeedProduct(product: SeedProduct, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  if (name === q || brand === q) return 1;
  if (name.startsWith(q)) return 0.9;
  if (name.includes(q)) return 0.8;
  if (brand.startsWith(q)) return 0.75;

  // Keyword matching is only safe for a single-word query. Testing
  // `query.includes(keyword)` against a multi-word query lets one common word
  // hijack the whole search: "Suhana Masala Diya" contains "masala" and would
  // otherwise resolve to Maggi Masala-ae-Magic, which is a different product
  // sold by a different brand.
  if (words.length === 1) {
    if (product.keywords.some((k) => k === q || k.includes(q))) return 0.7;
  } else {
    // Strong: every query word appears in the product's own name or brand.
    // "Amul Taaza Milk" against "Amul Taaza Toned Milk" is the same product
    // with a dropped qualifier, so the curated record is safe to trust.
    if (words.every((w) => `${name} ${brand}`.includes(w))) return 0.85;

    // Weak: the words are only found in the keyword bag or category, which
    // usually reflects a shared generic term rather than the same item.
    const haystack = `${name} ${brand} ${product.category} ${product.keywords.join(' ')}`;
    if (words.every((w) => haystack.includes(w))) return 0.5;
  }

  return 0;
}

export type RankedSeed = { product: SeedProduct; relevance: number };

export function rankSeedCatalog(query: string): RankedSeed[] {
  return SEED_CATALOG.map((product) => ({ product, relevance: scoreSeedProduct(product, query) }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
}

function listingFor(product: SeedProduct, platform: PlatformId): PlatformListing | null {
  const listing = product.listings.find((l) => l.platform === platform);
  if (!listing) return null;

  return {
    platformProductId: `${product.id}:${platform}`,
    title: listing.title,
    mrpPaise: listing.mrpPaise,
    pricePaise: listing.pricePaise,
    inStock: listing.inStock,
    promoLabels: listing.promoLabels,
    packSize: product.packSize,
  };
}

export const seedAdapter: ProviderAdapter = {
  id: 'seed',
  description:
    'Authored local catalogue. Always available and used as the last-resort fallback for every platform.',
  platforms: [],

  isConfigured() {
    return true;
  },

  async search(platform, ctx: SearchContext): Promise<PlatformSearchResult> {
    const listings = rankSeedCatalog(ctx.query)
      .map(({ product }) => listingFor(product, platform))
      .filter((l): l is PlatformListing => l !== null);

    return {
      platform,
      source: 'seed',
      listings,
      fetchedAt: new Date().toISOString(),
    };
  },

  async darkStores(platform: PlatformId): Promise<DarkStore[]> {
    return DARK_STORES.filter((s) => s.platform === platform);
  },
};
