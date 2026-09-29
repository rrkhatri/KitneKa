import { PINCODE_LOCATIONS } from '@/data/pincodes';
import { haversineKm } from '@/lib/match/similarity';

export type NearestPincode = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  distanceKm: number;
};

/**
 * Nearest known pincode to a GPS coordinate.
 *
 * Resolution happens against the bundled postal dataset rather than a hosted
 * reverse-geocoding API. Three reasons, in order of importance:
 *   - it needs no API key, quota or network round-trip, so it cannot fail
 *   - it never sends a user's precise location to a third party
 *   - it returns an Indian pincode, which is what the delivery check actually
 *     needs — a neighbourhood name from a generic geocoder would not do
 *
 * A GPS fix is typically accurate to ~10-30m, far tighter than the distance
 * between neighbouring pincodes, so nearest-neighbour is the right method.
 */
export function nearestPincode(lat: number, lng: number): NearestPincode | null {
  let best: NearestPincode | null = null;

  for (const record of Object.values(PINCODE_LOCATIONS)) {
    const distanceKm = haversineKm({ lat, lng }, { lat: record.lat, lng: record.lng });
    if (!best || distanceKm < best.distanceKm) {
      best = {
        pincode: record.pincode,
        locality: record.locality,
        city: record.city,
        state: record.state,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    }
  }

  return best;
}
