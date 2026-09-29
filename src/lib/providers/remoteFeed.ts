/**
 * Remote feed adapter.
 *
 * This is the integration point for REAL data. It speaks a small, documented
 * HTTP contract and is the only place in the codebase that performs outbound
 * network calls, so the blast radius of a misbehaving upstream is contained.
 *
 * It is deliberately written against a contract rather than against any one
 * platform's private API. Point `QUICKCOMMERCE_FEED_URL` at whichever of these
 * you actually have:
 *
 *   1. A licensed quick-commerce data partner feed  (the intended use)
 *   2. Your own scraper running as a sidecar service that holds the sessions,
 *      proxy rotation and parsing — keep the brittle parts out of the web app,
 *      where a platform's anti-bot change would otherwise take down a page
 *   3. A future official platform API, once one is published
 *
 * On 2xx-with-valid-shape it wins. On network error, timeout, 4xx/5xx, rate
 * limit, or a payload that does not validate, it throws a ProviderError and the
 * chain silently falls back to the seed catalogue. The user still gets an
 * answer; the health endpoint reports the degradation.
 *
 * ── Contract ────────────────────────────────────────────────────────────────
 *   GET {base}/v1/platforms/{platform}/search?q={query}&pincode={pincode}
 *     200 { "listings": [
 *            { "id": "...", "title": "...", "imageUrl": "...",
 *              "mrpPaise": 2900, "pricePaise": 2700, "inStock": true,
 *              "promoLabels": ["..."], "packSize": "500 ml", "etaMinutes": 11 }
 *          ] }
 *
 *   GET {base}/v1/platforms/{platform}/stores
 *     200 { "stores": [ { "id","name","locality","city","pincode",
 *                          "lat","lng","baseEtaMinutes","serviceRadiusKm" } ] }
 *
 *   Money is integer paise everywhere. Sending rupees or floats here is the one
 *   mistake that silently corrupts every price comparison in the product.
 *
 * Authorization: `Authorization: Bearer $QUICKCOMMERCE_FEED_TOKEN` when set.
 */

import type { DarkStore, PlatformId } from '@/lib/types';
import {
  ProviderError,
  type PlatformListing,
  type PlatformSearchResult,
  type ProviderAdapter,
  type SearchContext,
} from './types';

const DEFAULT_TIMEOUT_MS = 4000;

function feedBaseUrl(): string | null {
  const url = process.env.QUICKCOMMERCE_FEED_URL?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

function feedToken(): string | null {
  const token = process.env.QUICKCOMMERCE_FEED_TOKEN?.trim();
  return token ? token : null;
}

function timeoutMs(): number {
  const raw = Number(process.env.QUICKCOMMERCE_FEED_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

/** Combine the caller's abort signal with our own timeout. */
function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

async function getJson(
  url: string,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  const { signal: signalWithTimeout, dispose } = withTimeout(signal, timeoutMs());

  let response: Response;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = feedToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    response = await fetch(url, {
      headers,
      signal: signalWithTimeout,
      // Prices must never be served stale from an intermediary cache.
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderError(`Feed request timed out after ${timeoutMs()}ms`, 'timeout');
    }
    throw new ProviderError(
      `Feed request failed: ${err instanceof Error ? err.message : String(err)}`,
      'network',
    );
  } finally {
    dispose();
  }

  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('Feed rejected the credentials', 'auth', response.status);
  }
  if (response.status === 429) {
    throw new ProviderError('Feed rate limit reached', 'http', 429);
  }
  if (!response.ok) {
    throw new ProviderError(`Feed returned ${response.status}`, 'http', response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ProviderError('Feed returned a body that is not valid JSON', 'shape');
  }
}

// ── Runtime shape guards ─────────────────────────────────────────────────────
// Trust nothing from the network. A feed that starts returning a string where a
// number belongs must fail loudly here, not produce "₹NaN" in the UI.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPaise(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  return null;
}

function parseListing(raw: unknown): PlatformListing | null {
  if (!isRecord(raw)) return null;

  const id = typeof raw.id === 'string' ? raw.id : typeof raw.productId === 'string' ? raw.productId : null;
  const title = typeof raw.title === 'string' ? raw.title : typeof raw.name === 'string' ? raw.name : null;
  const pricePaise = readPaise(raw.pricePaise);
  const mrpPaise = readPaise(raw.mrpPaise);

  if (!id || !title || pricePaise === null) return null;

  return {
    platformProductId: id,
    title,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    pricePaise,
    // A missing MRP is normal; a missing price is not.
    mrpPaise: mrpPaise ?? pricePaise,
    inStock: raw.inStock !== false,
    promoLabels: Array.isArray(raw.promoLabels)
      ? raw.promoLabels.filter((p): p is string => typeof p === 'string')
      : [],
    packSize: typeof raw.packSize === 'string' ? raw.packSize : undefined,
    etaMinutes: typeof raw.etaMinutes === 'number' && Number.isFinite(raw.etaMinutes)
      ? Math.round(raw.etaMinutes)
      : undefined,
  };
}

function parseStore(raw: unknown, platform: PlatformId): DarkStore | null {
  if (!isRecord(raw)) return null;

  const id = typeof raw.id === 'string' ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name : null;
  const lat = typeof raw.lat === 'number' ? raw.lat : null;
  const lng = typeof raw.lng === 'number' ? raw.lng : null;

  if (!id || !name || lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    id,
    platform,
    name,
    locality: typeof raw.locality === 'string' ? raw.locality : '',
    city: typeof raw.city === 'string' ? raw.city : '',
    pincode: typeof raw.pincode === 'string' ? raw.pincode : '',
    location: { lat, lng },
    baseEtaMinutes: typeof raw.baseEtaMinutes === 'number' ? raw.baseEtaMinutes : 10,
    serviceRadiusKm: typeof raw.serviceRadiusKm === 'number' ? raw.serviceRadiusKm : 7,
  };
}

export const remoteFeedAdapter: ProviderAdapter = {
  id: 'remote-feed',
  description:
    'HTTP feed adapter. Reads live prices from QUICKCOMMERCE_FEED_URL (licensed partner, self-hosted scraper, or official API). Falls back to the seed catalogue on any failure.',

  platforms: [],

  isConfigured() {
    return feedBaseUrl() !== null;
  },

  async search(platform, ctx: SearchContext): Promise<PlatformSearchResult> {
    const base = feedBaseUrl();
    if (!base) {
      throw new ProviderError('QUICKCOMMERCE_FEED_URL is not set', 'not-configured');
    }

    const params = new URLSearchParams({ q: ctx.query });
    if (ctx.pincode) params.set('pincode', ctx.pincode);

    const url = `${base}/v1/platforms/${platform}/search?${params.toString()}`;
    const payload = await getJson(url, ctx.signal);

    if (!isRecord(payload) || !Array.isArray(payload.listings)) {
      throw new ProviderError('Feed response did not contain a listings array', 'shape');
    }

    const listings = payload.listings
      .map(parseListing)
      .filter((l): l is PlatformListing => l !== null);

    return {
      platform,
      source: 'live',
      listings,
      fetchedAt: typeof payload.fetchedAt === 'string' ? payload.fetchedAt : new Date().toISOString(),
    };
  },

  async darkStores(platform: PlatformId): Promise<DarkStore[]> {
    const base = feedBaseUrl();
    if (!base) {
      throw new ProviderError('QUICKCOMMERCE_FEED_URL is not set', 'not-configured');
    }

    const url = `${base}/v1/platforms/${platform}/stores`;
    const payload = await getJson(url, undefined);

    if (!isRecord(payload) || !Array.isArray(payload.stores)) {
      throw new ProviderError('Feed response did not contain a stores array', 'shape');
    }

    return payload.stores
      .map((s) => parseStore(s, platform))
      .filter((s): s is DarkStore => s !== null);
  },
};
