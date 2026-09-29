import test from 'node:test';
import assert from 'node:assert/strict';

import { bestConsensus, buildConsensus } from '../src/lib/match/consensus';
import { compareProduct } from '../src/lib/search';
import type { PlatformListing } from '../src/lib/providers/types';
import type { PlatformId } from '../src/lib/types';

const listing = (over: Partial<PlatformListing> = {}): PlatformListing => ({
  platformProductId: 'x',
  title: 'Amul Taaza Toned Milk 500 ml',
  mrpPaise: 2900,
  pricePaise: 2700,
  inStock: true,
  ...over,
});

test('listings that agree are clustered together', () => {
  const clusters = buildConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b' })] },
    { platform: 'zepto', listings: [listing({ platformProductId: 'z', title: 'Amul Taaza Toned Milk, 500ml' })] },
    { platform: 'instamart', listings: [listing({ platformProductId: 'i', title: 'Amul Taaza Milk 500 ml' })] },
  ]);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].platforms.length, 3);
});

test('different products stay in separate clusters', () => {
  const clusters = buildConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b' })] },
    {
      platform: 'zepto',
      listings: [
        listing({ platformProductId: 'z1', title: 'Amul Taaza Toned Milk, 500ml' }),
        listing({ platformProductId: 'z2', title: 'Colgate Strong Teeth Toothpaste 200 g' }),
      ],
    },
  ]);

  assert.equal(clusters.length, 2);
  // The cluster agreed on by more platforms wins the ranking.
  assert.equal(clusters[0].platforms.length, 2);
});

test('a different pack size never joins the cluster', () => {
  const clusters = buildConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b' })] },
    { platform: 'zepto', listings: [listing({ platformProductId: 'z', title: 'Amul Taaza Toned Milk 1 L' })] },
  ]);

  assert.equal(clusters.length, 2, '500ml and 1L must not be the same cluster');
});

test('an unknown product the platforms agree on is still comparable', () => {
  // The whole point of consensus: nothing in the curated catalogue mentions
  // this product, yet four platforms list it.
  const shared = 'Some New Brand Protein Bar 45 g';
  const clusters = buildConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b', title: shared })] },
    { platform: 'zepto', listings: [listing({ platformProductId: 'z', title: 'Some New Brand Protein Bar, 45g' })] },
    { platform: 'instamart', listings: [listing({ platformProductId: 'i', title: 'Some New Brand Protein Bar 45 g' })] },
    { platform: 'amazon_fresh', listings: [listing({ platformProductId: 'a', title: 'Some New Brand Protein Bar 45 gm' })] },
  ]);

  const best = bestConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b', title: shared })] },
    { platform: 'zepto', listings: [listing({ platformProductId: 'z', title: 'Some New Brand Protein Bar, 45g' })] },
    { platform: 'instamart', listings: [listing({ platformProductId: 'i', title: 'Some New Brand Protein Bar 45 g' })] },
    { platform: 'amazon_fresh', listings: [listing({ platformProductId: 'a', title: 'Some New Brand Protein Bar 45 gm' })] },
  ]);

  assert.equal(clusters.length, 1);
  assert.equal(best!.platforms.length, 4);
});

test('the cluster representative is the listing the others agree with most', () => {
  const cluster = bestConsensus([
    { platform: 'blinkit', listings: [listing({ platformProductId: 'b', title: 'Amul Taaza Toned Milk 500 ml' })] },
    { platform: 'zepto', listings: [listing({ platformProductId: 'z', title: 'Amul Taaza Toned Milk 500 ml' })] },
    { platform: 'instamart', listings: [listing({ platformProductId: 'i', title: 'Amul Taaza Toned Milk 500 ml Buy Today' })] },
  ]);

  // The two plain titles are the majority view; the padded one is not the anchor.
  assert.equal(cluster!.representativeTitle, 'Amul Taaza Toned Milk 500 ml');
});

test('a search with no listings anywhere returns null rather than an empty table', async () => {
  const result = await compareProduct('quantum widget xyz', {});
  assert.equal(result, null);
});

test('a comparison reports whether identity came from the catalogue or consensus', async () => {
  const result = await compareProduct('Amul Taaza Milk', { pincode: '390007' });
  assert.ok(result);
  assert.equal(result!.identitySource, 'catalogue');
});

test('the platform list is a fixed set the consensus can rely on', async () => {
  const expected: PlatformId[] = [
    'blinkit',
    'zepto',
    'instamart',
    'amazon_fresh',
    'flipkart_minutes',
  ];
  const result = await compareProduct('Tata Salt', { pincode: '390007' });
  assert.ok(result);

  for (const offer of result!.offers) {
    assert.ok(expected.includes(offer.platform), `unexpected platform ${offer.platform}`);
  }
});
