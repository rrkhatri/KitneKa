/**
 * Dark store resolution.
 *
 * Each platform operates a network of small fulfilment centres ("dark stores").
 * A pincode is serviceable by a platform when it falls inside the service radius
 * of at least one of that platform's stores. We take the nearest store that
 * serves the pincode, because that is the one that will actually fulfil the
 * order, and it determines the delivery estimate.
 *
 * Store lists are always passed in rather than imported, so that a live feed's
 * stores are used when one is configured and the bundled dataset is used
 * otherwise — with no branching at the call sites.
 */

import { DARK_STORES } from '@/data/darkStores';
import { haversineKm } from '@/lib/match/similarity';
import type { DarkStore, PincodeLocation, PlatformId, Serviceability } from '@/lib/types';

const MIN_ETA_MINUTES = 8;
const MAX_ETA_MINUTES = 45;

export function getDarkStore(id: string): DarkStore | undefined {
  return DARK_STORES.find((s) => s.id === id);
}

/**
 * Distance-adjusted delivery estimate.
 *
 * Beyond the store's own base time, each km of separation adds time. The slope
 * is tuned so a 4 km hop still lands inside the "10 minute" promise these
 * platforms make in their marketing, and degrades gracefully outwards.
 */
export function estimateEtaMinutes(store: DarkStore, distanceKm: number): number {
  const travel = distanceKm <= 1 ? 3 : distanceKm * 2.2;
  const eta = store.baseEtaMinutes + travel;
  return Math.round(Math.min(MAX_ETA_MINUTES, Math.max(MIN_ETA_MINUTES, eta)));
}

export function findServiceabilityIn(
  stores: readonly DarkStore[],
  platform: PlatformId,
  location: PincodeLocation,
): Serviceability {
  if (!location.resolved) {
    return {
      platform,
      pincode: location.pincode,
      serviceable: false,
      darkStore: null,
      distanceKm: null,
      etaMinutes: null,
      reason: location.reason,
    };
  }

  const best = stores
    .filter((s) => s.platform === platform)
    .map((store) => ({ store, distanceKm: haversineKm(location.location, store.location) }))
    .filter(({ store, distanceKm }) => distanceKm <= store.serviceRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];

  if (!best) {
    return {
      platform,
      pincode: location.pincode,
      serviceable: false,
      darkStore: null,
      distanceKm: null,
      etaMinutes: null,
      reason: `${platformLabel(platform)} does not deliver to ${location.pincode} yet.`,
    };
  }

  return {
    platform,
    pincode: location.pincode,
    serviceable: true,
    darkStore: best.store,
    distanceKm: Math.round(best.distanceKm * 10) / 10,
    etaMinutes: estimateEtaMinutes(best.store, best.distanceKm),
  };
}

/** Serviceability for every platform, nearest store first. */
export function serviceabilityForAll(
  stores: readonly DarkStore[],
  location: PincodeLocation,
  platforms: readonly PlatformId[],
): Serviceability[] {
  return platforms.map((platform) => findServiceabilityIn(stores, platform, location));
}

function platformLabel(platform: PlatformId): string {
  switch (platform) {
    case 'blinkit': return 'Blinkit';
    case 'zepto': return 'Zepto';
    case 'instamart': return 'Instamart';
    case 'amazon_fresh': return 'Amazon Fresh';
    case 'flipkart_minutes': return 'Flipkart Minutes';
  }
}
