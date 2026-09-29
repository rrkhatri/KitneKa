import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestPincode } from '../src/lib/geo/nearest';

test('a GPS fix resolves to the pincode a shopper would type', () => {
  // Coordinates of real localities, slightly offset the way a phone's GPS
  // fix actually is.
  const cases: [string, number, number, string][] = [
    ['Gotri, Vadodara', 22.3096, 73.2239, '390007'],
    ['Malad East, Mumbai', 19.1858, 72.8661, '400072'],
    ['Koramangala, Bengaluru', 12.9353, 77.6246, '560034'],
    ['Vesu, Surat', 21.1429, 72.7655, '395008'],
  ];

  for (const [name, lat, lng, expected] of cases) {
    const result = nearestPincode(lat, lng);
    assert.ok(result, `no match for ${name}`);
    assert.equal(result!.pincode, expected, `${name} resolved to ${result!.pincode} (${result!.locality})`);
  }
});

test('the nearest pincode is always a short hop from the given point', () => {
  const result = nearestPincode(22.30, 73.22);
  assert.ok(result!.distanceKm < 5, `implausible distance: ${result!.distanceKm} km`);
});
