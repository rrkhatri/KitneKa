/** Pincode resolution: 6-digit code -> location, with zone-level fallback. */

import { PINCODE_LOCATIONS, ZONE_CENTROIDS } from '@/data/pincodes';
import type { PincodeLocation } from '@/lib/types';

export function isValidPincode(input: string): boolean {
  return /^\d{6}$/.test(input.trim());
}

export function normalisePincode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

export function resolvePincode(input: string): PincodeLocation {
  const pincode = normalisePincode(input);

  if (pincode.length !== 6) {
    return {
      resolved: false,
      pincode,
      zone: pincode.slice(0, 3),
      reason: 'A pincode must be exactly 6 digits.',
    };
  }

  const exact = PINCODE_LOCATIONS[pincode];
  if (exact) {
    return {
      resolved: true,
      pincode,
      zone: pincode.slice(0, 3),
      city: exact.city,
      state: exact.state,
      locality: exact.locality,
      location: { lat: exact.lat, lng: exact.lng },
      precision: 'exact',
    };
  }

  const zone = ZONE_CENTROIDS[pincode.slice(0, 3)];
  if (zone) {
    return {
      resolved: true,
      pincode,
      zone: pincode.slice(0, 3),
      city: zone.city,
      state: zone.state,
      locality: `${zone.city} area`,
      location: { lat: zone.lat, lng: zone.lng },
      precision: 'zone-centroid',
    };
  }

  return {
    resolved: false,
    pincode,
    zone: pincode.slice(0, 3),
    reason: `We do not have location data for pincode ${pincode} yet.`,
  };
}
