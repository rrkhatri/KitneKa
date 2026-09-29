import test from 'node:test';
import assert from 'node:assert/strict';

import { extractPackSize, normalizeTitle } from '../src/lib/match/normalize';
import { comparePackSizes } from '../src/lib/match/packSize';
import { AUTO_MATCH_THRESHOLD, matchTitles } from '../src/lib/match/match';
import { SEED_CATALOG } from '../src/data/catalog';

test('extracts pack sizes across the formats platforms actually use', () => {
  // Units are kept as written; scaling to a base unit happens in toBase().
  assert.deepEqual(extractPackSize('Amul Taaza Toned Milk 500 ml'), { value: 500, unit: 'ml' });
  assert.deepEqual(extractPackSize('Coca Cola, 750ml'), { value: 750, unit: 'ml' });
  assert.deepEqual(extractPackSize('Britannia Good Day 1kg'), { value: 1, unit: 'kg' });
  assert.deepEqual(extractPackSize('Bisleri Water 1 L'), { value: 1, unit: 'l' });
  assert.deepEqual(extractPackSize('Whisper Ultra Clean 8 pads'), { value: 8, unit: 'pc' });
  assert.deepEqual(extractPackSize('Amul Cheese Slices 10 x 20 g'), { value: 200, unit: 'g' });
  assert.deepEqual(extractPackSize('Maggi 2-Minute Noodles 70 g'), { value: 70, unit: 'g' });
  assert.equal(extractPackSize('Shimla Apples'), null);
});

test('normalising treats "pack of" and bare counts as a unit count', () => {
  assert.deepEqual(extractPackSize('Colgate Strong Teeth Pack of 2'), { value: 2, unit: 'pc' });
  assert.deepEqual(extractPackSize('Maggi Noodles 6 pcs'), { value: 6, unit: 'pc' });
});

test('pack compatibility gates different quantities', () => {
  const ml500 = { value: 500, unit: 'ml' };
  assert.equal(comparePackSizes(ml500, { value: 500, unit: 'ml' }), 'exact');
  assert.equal(comparePackSizes(ml500, { value: 495, unit: 'ml' }), 'close');
  assert.equal(comparePackSizes(ml500, { value: 1000, unit: 'ml' }), 'off');
  // 1 litre is twice 500ml, not the same product.
  assert.equal(comparePackSizes(ml500, { value: 1, unit: 'l' }), 'off');
  // 0.5 L and 500 ml are the same volume written two ways.
  assert.equal(comparePackSizes(ml500, { value: 0.5, unit: 'l' }), 'exact');
  // 1 kg and 1000 g are the same weight written two ways.
  assert.equal(
    comparePackSizes({ value: 1, unit: 'kg' }, { value: 1000, unit: 'g' }),
    'exact',
  );
  assert.equal(comparePackSizes(null, ml500), 'unknown');
});

test('the same product titled differently on each platform matches', () => {
  const variants = [
    'Amul Taaza Toned Milk 500 ml',
    'Amul Taaza Toned Milk, 500ml',
    'Amul Taaza Toned Milk 500 ml',
  ];
  for (const v of variants) {
    const r = matchTitles('Amul Taaza Toned Milk 500 ml', v);
    assert.ok(r.score >= AUTO_MATCH_THRESHOLD, `"${v}" scored ${r.score}`);
    assert.equal(r.brandMatch, true);
  }
});

test('a different pack size is never a confident match, however similar the words', () => {
  const r = matchTitles('Amul Taaza Toned Milk 500 ml', 'Amul Taaza Toned Milk 1 L');
  assert.equal(r.packMismatch, true);
  assert.ok(r.score < AUTO_MATCH_THRESHOLD, `score was ${r.score}`);
});

test('a different brand is not a confident match', () => {
  const r = matchTitles('Britannia Good Day Cashew 600 g', 'Parle-G Gold Biscuits 800 g');
  assert.ok(r.score < AUTO_MATCH_THRESHOLD, `score was ${r.score}`);
});

test('a bare brand plus size matches a listing that adds generic qualifiers', () => {
  // Platforms routinely write "Pepsi Soft Drink, 750 ml" where the canonical
  // record is just "Pepsi 750 ml". Same brand, same quantity, extra adjectives.
  const cases: [string, string][] = [
    ['Pepsi 750 ml', 'Pepsi Soft Drink, 750 ml'],
    ['Sprite 750 ml', 'Sprite Lemon Lime Soft Drink, 750 ml'],
    ['Maggi 70 g', 'Maggi 2-Minute Noodles Masala 70 g'],
  ];

  for (const [canonical, listing] of cases) {
    const r = matchTitles(canonical, listing);
    assert.ok(r.score >= AUTO_MATCH_THRESHOLD, `"${listing}" scored ${r.score.toFixed(3)}`);
  }
});

test('same brand and same size but a different variant does NOT match', () => {
  // The floor for brand+quantity agreement must not fire when the two titles
  // both carry content words and disagree: Gold and Taaza are different milk.
  const r = matchTitles('Amul Gold Full Cream Milk 500 ml', 'Amul Taaza Toned Milk 500 ml');
  assert.ok(
    r.score < AUTO_MATCH_THRESHOLD,
    `different variants scored ${r.score.toFixed(3)} — the brand+quantity floor is too permissive`,
  );
  assert.equal(r.brandMatch, true);
});

test('volume written as 0.5 L and 500 ml compare equal', () => {
  const r = matchTitles('Amul Gold Full Cream Milk 500 ml', 'Amul Gold Milk 0.5 L');
  assert.ok(r.score >= AUTO_MATCH_THRESHOLD, `score was ${r.score}`);
});

test('dahi and curds resolve to the same token', () => {
  const a = normalizeTitle('Amul Curd 400 g');
  const b = normalizeTitle('Amul Dahi 400 g');
  assert.ok(a.content.includes('curd'));
  assert.ok(b.content.includes('curd'));
});

test('every seed listing matches its own canonical product', () => {
  const failures: string[] = [];

  for (const product of SEED_CATALOG) {
    for (const listing of product.listings) {
      const r = matchTitles(`${product.name} ${product.packSize}`, listing.title);
      if (r.score < AUTO_MATCH_THRESHOLD || r.packMismatch) {
        failures.push(
          `${product.id} / ${listing.platform}: "${listing.title}" scored ${r.score.toFixed(3)}` +
            (r.packMismatch ? ' (pack mismatch)' : ''),
        );
      }
    }
  }

  assert.deepEqual(failures, [], `unmatched seed listings:\n${failures.join('\n')}`);
});
