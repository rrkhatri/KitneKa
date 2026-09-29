/**
 * Cross-platform consensus.
 *
 * The original implementation anchored a search on a row in a bundled
 * catalogue, which meant the app could only ever compare products somebody had
 * thought to hard-code. That is a demo, not a product.
 *
 * To compare ANY product the platforms list, the canonical identity has to be
 * discovered from the platforms themselves: run the same query against every
 * one of them, then find the group of listings that mutually agree on brand,
 * pack size and wording. That group IS the product.
 *
 * This is the same job a search index does, at the smallest useful scale.
 */

import { AUTO_MATCH_THRESHOLD, matchTitles } from './match';
import { normalizeTitle } from './normalize';
import type { PlatformId } from '@/lib/types';
import type { PlatformListing } from '@/lib/providers/types';

export type ClusteredListing = {
  listing: PlatformListing;
  platform: PlatformId;
  /** Confidence this listing belongs to the cluster it is assigned to. */
  confidence: number;
};

export type ConsensusCluster = {
  /** Representative title, taken from the listing with the best centrality. */
  representativeTitle: string;
  platforms: PlatformId[];
  listings: ClusteredListing[];
  /** Mean pairwise match quality inside the cluster, 0..1. */
  quality: number;
};

/**
 * Greedy single-pass clustering.
 *
 * Listings are visited in order; each is either attached to the cluster it
 * matches best, or starts a new one. Greedy is sufficient here because the
 * per-platform feeds return a handful of closely related results, not a
 * long tail of near-duplicates.
 *
 * Cost is O(n^2) in listings, which is fine for the 5-50 results a platform
 * search returns. If a feed ever returns thousands, cluster per platform
 * first and only cross-compare the cluster heads.
 */
export function buildConsensus(input: {
  platform: PlatformId;
  listings: PlatformListing[];
}[]): ConsensusCluster[] {
  const all = input.flatMap(({ platform, listings }) =>
    listings.map((listing) => ({ listing, platform })),
  );

  if (all.length === 0) return [];

  type Draft = { title: string; members: ClusteredListing[] };

  const drafts: Draft[] = [];

  for (const item of all) {
    let best: { draft: Draft; confidence: number } | null = null;

    for (const draft of drafts) {
      const r = matchTitles(draft.title, item.listing.title);
      if (r.packMismatch || r.score < AUTO_MATCH_THRESHOLD) continue;
      if (!best || r.score > best.confidence) best = { draft, confidence: r.score };
    }

    if (best) {
      best.draft.members.push({ ...item, confidence: best.confidence });
    } else {
      drafts.push({
        title: item.listing.title,
        members: [{ ...item, confidence: 1 }],
      });
    }
  }

  return drafts
    .map((draft) => {
      // The representative is the member most similar to the others: the
      // listing the other platforms agree with most closely. A title that one
      // platform padded with marketing words should not become the anchor.
      let representative = draft.members[0];
      let bestCentrality = -1;

      for (const candidate of draft.members) {
        let total = 0;
        for (const other of draft.members) {
          if (other === candidate) continue;
          total += matchTitles(candidate.listing.title, other.listing.title).score;
        }
        const centrality = draft.members.length > 1 ? total / (draft.members.length - 1) : 1;
        if (centrality > bestCentrality) {
          bestCentrality = centrality;
          representative = candidate;
        }
      }

      const platforms = [...new Set(draft.members.map((m) => m.platform))];
      const quality =
        draft.members.reduce((sum, m) => sum + m.confidence, 0) / draft.members.length;

      return {
        representativeTitle: representative.listing.title,
        platforms,
        listings: draft.members,
        quality: bestCentrality < 0 ? quality : bestCentrality,
      };
    })
    .sort((a, b) => {
      // Most platforms agreeing wins — a product listed on four apps is a
      // better answer than the same product on two — then best quality.
      if (b.platforms.length !== a.platforms.length) return b.platforms.length - a.platforms.length;
      return b.quality - a.quality;
    });
}

/**
 * The single best cluster: the product the most platforms agree on.
 * Returns null only when no platform returned anything.
 */
export function bestConsensus(
  input: { platform: PlatformId; listings: PlatformListing[] }[],
): ConsensusCluster | null {
  return buildConsensus(input)[0] ?? null;
}

/**
 * A lightweight canonical record synthesised from a consensus cluster, so the
 * rest of the app can keep treating the comparison as a normal CanonicalProduct
 * no matter where the identity came from.
 */
export function canonicalFromCluster(cluster: ConsensusCluster, query: string) {
  const normalised = normalizeTitle(cluster.representativeTitle);
  const brand = normalised.brand ?? 'Unknown';
  const title = cluster.representativeTitle;

  return {
    id: `live:${normalised.normalized.replace(/\s+/g, '-').slice(0, 60)}`,
    name: title,
    brand,
    category: 'Uncategorised',
    packSize: normalised.pack ? `${normalised.pack.value} ${normalised.pack.unit}` : '',
    unit: normalised.pack?.unit ?? '',
    imageUrl: '',
    keywords: [query.toLowerCase(), brand, ...normalised.content],
    /** True when this identity was discovered rather than looked up. */
    discovered: true,
    platformCount: cluster.platforms.length,
  };
}
