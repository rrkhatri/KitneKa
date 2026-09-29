/**
 * Adapter chain.
 *
 * Resolution order per platform, first success wins:
 *   1. remoteFeedAdapter — live prices, when QUICKCOMMERCE_FEED_URL is set
 *   2. seedAdapter        — authored catalogue, always present
 *
 * Failures are captured, not thrown, so one broken upstream degrades that
 * platform to reference pricing while the other four still return live data.
 * Every degradation is recorded and surfaced by /api/health — silent fallback
 * is how a price comparison app starts lying to its users.
 */

import { PLATFORM_ORDER } from '@/lib/platforms';
import type { PlatformId } from '@/lib/types';
import { remoteFeedAdapter } from './remoteFeed';
import { seedAdapter } from './seed';
import { ProviderError, type ProviderAdapter, type SearchContext } from './types';

export const ADAPTERS: ProviderAdapter[] = [remoteFeedAdapter, seedAdapter];

export type Degradation = {
  platform: PlatformId;
  adapter: string;
  kind: string;
  message: string;
  /** The adapter that served the request instead. */
  servedBy: string;
};

export type ChainResult<T> = {
  value: T;
  servedBy: string;
  degradations: Degradation[];
};

/**
 * Run `op` against each adapter in order, returning the first usable result.
 *
 * "Unusable" means either the adapter threw a ProviderError, or it succeeded
 * but `accept` rejected the result. The second case matters: a live feed that
 * simply does not stock a product returns 200 with an empty list, and treating
 * that as a success would let one partial catalogue decide what the whole app
 * is able to compare. Falling through instead fills each platform in from
 * whatever source does have the item — and every offer keeps its own `source`
 * label, so a reference price is never shown as a live one.
 *
 * Only a `ProviderError` is treated as "try the next one" — an unexpected bug
 * in an adapter is allowed to surface rather than being silently swallowed.
 */
export async function resolveWithFallback<T>(
  platform: PlatformId,
  op: (adapter: ProviderAdapter) => Promise<T>,
  options: { signal?: AbortSignal; accept?: (value: T) => boolean } = {},
): Promise<ChainResult<T>> {
  const degradations: Degradation[] = [];
  const candidates = ADAPTERS.filter(
    (a) => a.isConfigured() && (a.platforms.length === 0 || a.platforms.includes(platform)),
  );

  for (let i = 0; i < candidates.length; i++) {
    const adapter = candidates[i];
    const nextAdapter = candidates[i + 1];

    try {
      const value = await op(adapter);

      if (options.accept && !options.accept(value)) {
        degradations.push({
          platform,
          adapter: adapter.id,
          kind: 'empty',
          message: `${adapter.id} returned no listings for this query`,
          servedBy: nextAdapter?.id ?? 'none',
        });
        continue;
      }

      return { value, servedBy: adapter.id, degradations };
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;

      degradations.push({
        platform,
        adapter: adapter.id,
        kind: err.kind,
        message: err.message,
        servedBy: nextAdapter?.id ?? 'none',
      });

      // The caller cancelled the request — stop trying, let the client see it.
      if (err.kind === 'timeout' && options.signal?.aborted) break;
    }
  }

  throw new ProviderError(
    `No configured adapter could serve ${platform}`,
    'not-configured',
  );
}

export function searchWithFallback(platform: PlatformId, ctx: SearchContext) {
  return resolveWithFallback(platform, (adapter) => adapter.search(platform, ctx), {
    signal: ctx.signal,
    accept: (result) => result.listings.length > 0,
  });
}

export function darkStoresWithFallback(platform: PlatformId) {
  return resolveWithFallback(platform, (adapter) => adapter.darkStores(platform));
}

export { PLATFORM_ORDER };
