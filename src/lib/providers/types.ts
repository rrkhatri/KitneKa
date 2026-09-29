/**
 * Provider adapter contract.
 *
 * Every source of product and pricing data implements this interface, and the
 * app only ever talks to adapters through it. That means a licensed data feed, a
 * self-hosted scraper proxy, or a future official platform API can be added
 * without touching the matcher, the search orchestrator, or any UI component.
 *
 * Adapters return RAW per-platform listings. They do not match products to one
 * another and they do not sort — that is the core domain's job, and keeping it
 * out of the adapters means a new source cannot quietly introduce a bad sort.
 */

import type { DarkStore, PlatformId } from '@/lib/types';
import type { DataSource } from '@/lib/types';

/** A single product listing as returned by a platform feed, unnormalised. */
export type PlatformListing = {
  /** The platform's own product identifier. */
  platformProductId: string;
  /** Title exactly as the platform renders it. */
  title: string;
  imageUrl?: string;
  /** Listed price, in paise. */
  mrpPaise: number;
  /** Price the user pays, in paise. */
  pricePaise: number;
  inStock: boolean;
  promoLabels?: string[];
  /** Optional explicit pack size, e.g. "500 ml". Falls back to the title. */
  packSize?: string;
  /** Optional per-listing delivery estimate. */
  etaMinutes?: number;
};

export type PlatformSearchResult = {
  platform: PlatformId;
  source: DataSource;
  listings: PlatformListing[];
  /** ISO timestamp the feed claims this data is current as of. */
  fetchedAt: string;
};

export type SearchContext = {
  query: string;
  /** Pincode the user supplied, or null for a generic national search. */
  pincode: string | null;
  signal?: AbortSignal;
};

export interface ProviderAdapter {
  /** Stable identifier, surfaced in /api/health for debugging. */
  readonly id: string;
  /** Human-readable description for the health endpoint and README. */
  readonly description: string;
  /** Platforms this adapter can serve. Empty array means "all". */
  readonly platforms: PlatformId[];
  /** Cheap synchronous check — no adapter should do network I/O here. */
  isConfigured(): boolean;
  search(platform: PlatformId, ctx: SearchContext): Promise<PlatformSearchResult>;
  darkStores(platform: PlatformId): Promise<DarkStore[]>;
}

/** Typed failures the chain understands. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'timeout' | 'auth' | 'shape' | 'not-configured' | 'http',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
