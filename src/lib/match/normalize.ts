/**
 * Title normalisation and structured extraction.
 *
 * The same physical product is titled differently on every platform:
 *   Blinkit    "Amul Taaza Toned Milk 500 ml"
 *   Zepto      "Amul Taaza Toned Milk, 500ml"
 *   Instamart  "Amul Taaza Milk - 500 ml"
 *   Amazon     "Amul Taaza Toned Milk, 500 ml"
 *
 * Matching therefore cannot be a string equality check. We reduce a title to
 * three comparable signals: brand, pack size, and a bag of content words.
 */

import type { PackSize } from './packSize';

/** Marketing / filler words that carry no identifying information. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'by', 'in', 'on', 'to',
  'new', 'pack', 'packed', 'packet', 'box', 'x', 'free', 'offer', 'special',
  'combo', 'value', 'premium', 'original', 'best', 'quality', 'fresh', 'hot',
  'sale', 'deal', 'buy', 'online', 'price', 'mrp', 'rs', 'only', 'plus', 'plusplus',
]);

/** Synonyms collapsed to a single token so "toned" vs "tone" style variance and
 *  filler variants do not break the match. */
const SYNONYMS: Record<string, string> = {
  toned: 'tonedmilk',
  tonned: 'tonedmilk',
  skimmed: 'skimmilk',
  'full-fat': 'fullfat',
  fullfat: 'fullfat',
  'full-cream': 'fullfat',
  cream: 'fullfat',
  multigrain: 'multigrain',
  'multi-grain': 'multigrain',
  biscuits: 'biscuit',
  cookies: 'biscuit',
  namkeen: 'snack',
  dahi: 'curd',
  yogurt: 'curd',
  yoghurt: 'curd',
  papad: 'papad',
  papadum: 'papad',
  'diet-fizz': 'diet',
  'no-added-sugar': 'nosugar',
  'sugar-free': 'nosugar',
  'no sugar': 'nosugar',
  'green-tea': 'greentea',
  noodles: 'noodle',
};

/** Units that mean "a count" rather than a measurement. */
const COUNT_UNITS = [
  'pcs', 'pc', 'pieces', 'piece', 'nos', 'units', 'unit', 'count', 'cts',
  'pads', 'pad', 'bottles', 'bottle', 'sachets', 'sachet', 'packs', 'pack',
  'boxes', 'box',
];

/** Units that measure something. Order matters: longer forms first so that
 *  "litres" is not consumed as "l" by the regex. */
const MEASURE_UNITS = [
  'kilograms', 'kilogram', 'kilos', 'kilo', 'litres', 'litre', 'fl-oz',
  'ml', 'kg', 'gm', 'cl', 'oz', 'g', 'l',
];

/** Canonical spelling of a detected unit. Scaling happens in packSize.ts, so
 *  "l" stays "l" and is converted to millilitres there rather than here. */
const UNIT_CANON: Record<string, string> = {
  litre: 'l', litres: 'l', ltr: 'l', lt: 'l',
  kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  gm: 'g',
  'fl-oz': 'ml', oz: 'ml',
  piece: 'pc', pieces: 'pc', pcs: 'pc', pad: 'pc', pads: 'pc',
  unit: 'pc', units: 'pc', nos: 'pc', count: 'pc', cts: 'pc',
  bottle: 'pc', bottles: 'pc', sachet: 'pc', sachets: 'pc',
  pack: 'pc', packs: 'pc', box: 'pc', boxes: 'pc',
};

const UNIT_ALT = [...COUNT_UNITS, ...MEASURE_UNITS].join('|');
const UNIT_PATTERN = `(?:${UNIT_ALT})`;

export type NormalizedTitle = {
  raw: string;
  normalized: string;
  tokens: string[];
  brand: string | null;
  pack: PackSize | null;
  /** Tokens with stopwords removed, used for the content-word comparison. */
  content: string[];
};

function toNumberToken(word: string): string | null {
  // Handles "0.5l", "1.5", "500" and strips stray punctuation.
  const m = word.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, numStr, suffix] = m;
  const unit = suffix.replace(/[^a-z]/g, '');
  const canon = UNIT_CANON[unit] ?? unit;
  return canon ? `${numStr}${canon}` : numStr;
}

/**
 * Pull a pack size out of a title.
 *
 * Handles the forms the platforms actually publish: "500 ml", "0.5 L", "1kg",
 * "10 x 20 g", "Pack of 6", "8 pads", "6 pcs".
 *
 * Multipliers ("4 x 100 ml") are folded into the total, so a 4x100ml pack
 * equals 400ml and matches a 400ml single listing — which is how a shopper
 * reads both titles and would be misled by a strict string match.
 */
export function extractPackSize(title: string): PackSize | null {
  const text = ` ${title.toLowerCase().replace(/[×✕]/g, ' x ').replace(/,/g, ' ')} `;

  // A bare "pack of N" is itself the count, not a multiplier on some other
  // measurement. Tracked separately so it is never applied twice.
  const packOf = text.match(/\bpack\s*of\s*(\d+)\b/);
  const packOfCount = packOf ? Number(packOf[1]) : null;

  // "4 x 100 ml" — take the measurement, apply the leading multiplier.
  const multiplied = text.match(
    new RegExp(String.raw`(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(${UNIT_PATTERN})\b`),
  );

  if (multiplied) {
    const value = Number(multiplied[2]) * Number(multiplied[1]) * (packOfCount ?? 1);
    return { value, unit: UNIT_CANON[multiplied[3]] ?? multiplied[3] };
  }

  // "500 ml", "8 pads", "6 pcs", "1kg"
  const single = text.match(new RegExp(String.raw`(\d+(?:\.\d+)?)\s*(${UNIT_PATTERN})\b`));
  if (single) {
    return { value: Number(single[1]), unit: UNIT_CANON[single[2]] ?? single[2] };
  }

  // "Pack of 6" / "6 count" with no unit word we recognise.
  if (packOfCount !== null) return { value: packOfCount, unit: 'pc' };

  return null;
}

/**
 * Best-effort brand extraction.
 *
 * Hyphens are kept inside the brand token so "Coca-Cola" and "Marie-Gold"
 * survive as single brands, but stripped of punctuation, which normalises
 * "Coca Cola" and "Coca-Cola" to the same thing.
 */
export function extractBrand(title: string): string | null {
  const cleaned = title.replace(/^(fresho|bigbasket|amazon|flipkart|blinkit|zepto)\s+/i, '');
  const first = cleaned.split(/[\s,/|]+/)[0]?.toLowerCase().replace(/[^a-z0-9&]/g, '');
  if (!first || first.length < 2) return null;
  // A leading number means the title started with the pack size, not a brand.
  if (/^\d/.test(first)) return null;
  return first;
}

export function normalizeTitle(title: string): NormalizedTitle {
  const raw = title;

  // Pull the pack size out before tokenising so "500ml" is not compared as a word.
  const pack = extractPackSize(raw);

  // Remove measurement tokens so they do not dilute content-word similarity.
  let scrubbed = raw.toLowerCase();
  scrubbed = scrubbed.replace(
    new RegExp(String.raw`\d+(?:\.\d+)?\s*x?\s*${UNIT_PATTERN}\b`, 'g'),
    ' ',
  );
  scrubbed = scrubbed.replace(/\bpack\s*of\s*\d+\b/g, ' ');

  const brand = extractBrand(raw);

  const tokens = scrubbed
    .split(/[^a-z0-9&]+/)
    .filter(Boolean)
    .map((t) => toNumberToken(t) ?? t)
    .map((t) => SYNONYMS[t] ?? t)
    .filter(Boolean);

  const content = tokens.filter((t) => !STOPWORDS.has(t));

  // The brand is compared separately, so remove it from the content bag to
  // avoid double-counting its contribution.
  const contentWithoutBrand = brand ? content.filter((t) => t !== brand) : content;

  return {
    raw,
    normalized: tokens.join(' '),
    tokens,
    brand,
    pack,
    content: contentWithoutBrand,
  };
}
