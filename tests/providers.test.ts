import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveWithFallback } from '../src/lib/providers/registry';
import { ProviderError, type PlatformListing, type ProviderAdapter } from '../src/lib/providers/types';
import { ADAPTERS } from '../src/lib/providers/registry';
import type { PlatformId } from '../src/lib/types';

function makeAdapter(
  id: string,
  behaviour: 'ok' | 'empty' | 'error',
  listings: PlatformListing[] = [],
): ProviderAdapter {
  return {
    id,
    description: id,
    platforms: [],
    isConfigured: () => true,
    async search() {
      if (behaviour === 'error') throw new ProviderError(`${id} exploded`, 'network');
      return {
        platform: 'blinkit' as PlatformId,
        source: 'live',
        listings: behaviour === 'empty' ? [] : listings,
        fetchedAt: new Date().toISOString(),
      };
    },
    async darkStores() {
      return [];
    },
  };
}

test('an adapter that errors falls through to the next one', async () => {
  const good = makeAdapter('good', 'ok', [
    {
      platformProductId: 'p',
      title: 't',
      mrpPaise: 100,
      pricePaise: 90,
      inStock: true,
    },
  ]);

  const original = [...ADAPTERS];
  try {
    // Swap the module-level chain for the duration of the assertion.
    (ADAPTERS as unknown as ProviderAdapter[]).length = 0;
    ADAPTERS.push(makeAdapter('broken', 'error'), good);

    const result = await resolveWithFallback('blinkit', (a) => a.search('blinkit', { query: 'x', pincode: null }));

    assert.equal(result.servedBy, 'good');
    assert.equal(result.degradations.length, 1);
    assert.equal(result.degradations[0].kind, 'network');
  } finally {
    (ADAPTERS as unknown as ProviderAdapter[]).length = 0;
    ADAPTERS.push(...original);
  }
});

test('an adapter with nothing to say falls through rather than winning', async () => {
  const stocked = makeAdapter('stocked', 'ok', [
    { platformProductId: 'p', title: 't', mrpPaise: 100, pricePaise: 90, inStock: true },
  ]);

  const original = [...ADAPTERS];
  try {
    (ADAPTERS as unknown as ProviderAdapter[]).length = 0;
    ADAPTERS.push(makeAdapter('partial-feed', 'empty'), stocked);

    const result = await resolveWithFallback(
      'blinkit',
      (a) => a.search('blinkit', { query: 'x', pincode: null }),
      { accept: (r) => r.listings.length > 0 },
    );

    assert.equal(result.servedBy, 'stocked', 'a partial feed must not win');
    assert.equal(result.degradations[0].kind, 'empty');
  } finally {
    (ADAPTERS as unknown as ProviderAdapter[]).length = 0;
    ADAPTERS.push(...original);
  }
});

test('a feed that does not stock the product still lets the catalogue answer', async () => {
  // This is the behaviour that keeps the app useful while a live feed is
  // being rolled out: a product the feed has never heard of is still
  // comparable, labelled as a reference price.
  const { compareProduct } = await import('../src/lib/search');
  const result = await compareProduct('Tata Salt', { pincode: '390007' });

  assert.ok(result, 'a curated product must remain comparable');
  assert.ok(result!.offers.length > 0);
  for (const offer of result!.offers) {
    assert.ok(
      offer.source === 'live' || offer.source === 'seed',
      `unexpected source ${offer.source}`,
    );
  }
});
