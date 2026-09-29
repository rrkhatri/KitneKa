import test from 'node:test';
import assert from 'node:assert/strict';

import { compareProduct, sortOffers } from '../src/lib/search';
import { findServiceabilityIn, estimateEtaMinutes } from '../src/lib/pincode/darkStore';
import { resolvePincode } from '../src/lib/pincode/resolve';
import { DARK_STORES } from '../src/data/darkStores';
import { SEED_CATALOG } from '../src/data/catalog';
import type { Offer } from '../src/lib/types';

function offer(overrides: Partial<Offer>): Offer {
  return {
    platform: 'blinkit',
    platformProductId: 'p1',
    title: 'Test product',
    imageUrl: '',
    listedPackSize: '500 ml',
    mrpPaise: 3000,
    pricePaise: 2700,
    inStock: true,
    etaMinutes: 10,
    darkStoreId: '',
    promoLabels: [],
    observedAt: new Date().toISOString(),
    matchConfidence: 0.9,
    source: 'seed',
    ...overrides,
  };
}

test('offers sort cheapest first, with out-of-stock pushed to the bottom', () => {
  const sorted = sortOffers([
    offer({ platform: 'zepto', pricePaise: 2600 }),
    offer({ platform: 'amazon_fresh', pricePaise: 3000 }),
    offer({ platform: 'blinkit', pricePaise: 2700 }),
    offer({ platform: 'instamart', pricePaise: 100, inStock: false }),
  ]);

  assert.deepEqual(
    sorted.map((o) => o.platform),
    ['zepto', 'blinkit', 'amazon_fresh', 'instamart'],
  );
});

test('equal prices break the tie on delivery speed', () => {
  const sorted = sortOffers([
    offer({ platform: 'zepto', pricePaise: 2700, etaMinutes: 18 }),
    offer({ platform: 'blinkit', pricePaise: 2700, etaMinutes: 9 }),
  ]);

  assert.equal(sorted[0].platform, 'blinkit');
});

test('prices are ordered by integer paise, not by float comparison', () => {
  const sorted = sortOffers([
    offer({ platform: 'a' as Offer['platform'], pricePaise: 2699 }),
    offer({ platform: 'b' as Offer['platform'], pricePaise: 2700 }),
  ]);
  assert.equal(sorted[0].pricePaise, 2699);
});

test('pincodes resolve exactly, or fall back to a zone centroid', () => {
  const exact = resolvePincode('390007');
  assert.equal(exact.resolved, true);
  assert.equal(exact.resolved && exact.precision, 'exact');
  assert.equal(exact.resolved && exact.city, 'Vadodara');

  const approximate = resolvePincode('390099');
  assert.equal(approximate.resolved, true);
  assert.equal(approximate.resolved && approximate.precision, 'zone-centroid');

  const bad = resolvePincode('12');
  assert.equal(bad.resolved, false);
});

test('serviceability picks the nearest store inside the service radius', () => {
  const location = resolvePincode('390007');
  const s = findServiceabilityIn(DARK_STORES, 'blinkit', location);

  assert.equal(s.serviceable, true);
  assert.equal(s.darkStore?.city, 'Vadodara');
  assert.ok((s.distanceKm ?? Infinity) <= (s.darkStore?.serviceRadiusKm ?? 0));
  assert.ok((s.etaMinutes ?? 0) >= 8 && (s.etaMinutes ?? 0) <= 45);
});

test('a platform with no nearby store is reported as not serviceable', () => {
  const location = resolvePincode('390001');
  const s = findServiceabilityIn(DARK_STORES, 'flipkart_minutes', location);

  // Flipkart Minutes is not in the Vadodara dataset, which is the honest answer.
  assert.equal(s.serviceable, false);
  assert.ok(s.reason);
});

test('delivery estimate grows with distance but stays inside the promised window', () => {
  const near = estimateEtaMinutes(DARK_STORES[0], 0.5);
  const far = estimateEtaMinutes(DARK_STORES[0], 7);
  assert.ok(far > near);
  assert.ok(far <= 45);
  assert.ok(near >= 8);
});

test('comparison returns offers sorted cheapest first across all platforms', async () => {
  const result = await compareProduct('Amul Taaza Milk', { pincode: '390007' });

  assert.ok(result, 'expected a comparison result');
  assert.equal(result.product.id, 'amul-taaza-500');

  const inStock = result.offers.filter((o) => o.inStock);
  assert.ok(inStock.length >= 2, `expected multiple platforms, got ${inStock.length}`);

  const prices = inStock.map((o) => o.pricePaise);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'offers were not price-sorted');

  assert.ok(result.cheapest);
  assert.equal(result.cheapest.pricePaise, Math.min(...prices));
});

test('a pincode the platform cannot reach removes it from the buyable set', async () => {
  const withoutPin = await compareProduct('Amul Taaza Milk', { pincode: null });
  const withPin = await compareProduct('Amul Taaza Milk', { pincode: '390007' });

  assert.ok(withoutPin && withPin);

  const flipkartNational = withoutPin.offers.some((o) => o.platform === 'flipkart_minutes');
  const flipkartLocal = withPin.offers.some(
    (o) => o.platform === 'flipkart_minutes' && o.inStock,
  );

  // A national search has no serviceability check, so the listing shows but is
  // not marked in stock; with a Vadodara pincode it is correctly excluded.
  assert.equal(flipkartLocal, false);
  assert.equal(flipkartNational, true);
});

test('an unknown product returns null rather than a misleading comparison', async () => {
  assert.equal(await compareProduct('quantum widget xyz', {}), null);
  assert.equal(await compareProduct('   ', {}), null);
});

test('every platform in the seed catalogue is represented in a comparison', async () => {
  const result = await compareProduct('Coca-Cola', { pincode: '400072' });
  assert.ok(result);

  const platforms = new Set(result.offers.map((o) => o.platform));
  assert.ok(platforms.size >= 4, `only found ${platforms.size} platforms`);
});

test('the seed catalogue has sane invariants', () => {
  assert.ok(SEED_CATALOG.length >= 30);

  for (const product of SEED_CATALOG) {
    const platforms = new Set(product.listings.map((l) => l.platform));
    assert.ok(platforms.size >= 4, `${product.id} only lists on ${platforms.size} platforms`);

    for (const listing of product.listings) {
      assert.ok(listing.pricePaise > 0, `${product.id}/${listing.platform} has no price`);
      assert.ok(
        listing.mrpPaise >= listing.pricePaise,
        `${product.id}/${listing.platform} sells above its MRP`,
      );
    }
  }
});
