/**
 * Cross-platform product matching.
 *
 * Given a title from platform A and a candidate from platform B, produce a
 * 0..1 confidence that they are the same physical product.
 *
 * The design principle: a wrong "same product" match is far more damaging than
 * a missed one, because it reports a price for something the user would not
 * receive. So pack size acts as a gate, not just a feature, and every score is
 * returned with the reasons behind it for display in the UI.
 */

import { normalizeTitle, type NormalizedTitle } from './normalize';
import { comparePackSizes, type PackCompatibility } from './packSize';
import { clamp01, diceBigrams } from './similarity';

export type MatchResult = {
  /** 0..1 overall confidence. */
  score: number;
  /** Whether pack size is a hard mismatch (different quantity entirely). */
  packMismatch: boolean;
  brandMatch: boolean;
  signals: {
    brand: number;
    pack: number;
    lexical: number;
    content: number;
  };
  /** Short human-readable justification, shown under the match confidence badge. */
  reason: string;
};

const WEIGHTS = {
  brand: 0.3,
  pack: 0.25,
  lexical: 0.3,
  content: 0.15,
};

const PACK_SCORES: Record<PackCompatibility, number> = {
  exact: 1,
  close: 0.9,
  unknown: 0.55,
  off: 0,
};

/**
 * Score above which two listings are presented as the same product. Below it
 * the platform is reported in the "not shown" panel with a reason, rather than
 * being given a price for something the shopper would not receive.
 */
export const AUTO_MATCH_THRESHOLD = 0.72;

/** Neutral content score when one title carries no content words to compare. */
const NO_CONTENT_SIGNAL = 0.6;

/**
 * Agreement between two content-word sets, as a fraction of the shorter set.
 *
 * Jaccard alone is wrong here: a canonical "Pepsi" against a listing
 * "Pepsi Soft Drink" has zero Jaccard overlap because one set is empty, even
 * though one title plainly contains the other. The overlap coefficient gives
 * that case full credit while still penalising genuinely disjoint vocabulary.
 */
function contentAgreement(a: string[], b: string[]): number | null {
  if (a.length === 0 || b.length === 0) return null;

  const sa = new Set(a);
  const shared = b.filter((t) => sa.has(t)).length;

  return shared / Math.min(sa.size, b.length);
}

export function matchTitles(
  source: string | NormalizedTitle,
  candidate: string | NormalizedTitle,
): MatchResult {
  const a = typeof source === 'string' ? normalizeTitle(source) : source;
  const b = typeof candidate === 'string' ? normalizeTitle(candidate) : candidate;

  // --- Brand ---
  let brandSignal = 0.5; // unknown on both sides is neutral, not penalising
  let brandMatch = false;
  if (a.brand && b.brand) {
    brandMatch = a.brand === b.brand;
    if (brandMatch) {
      brandSignal = 1;
    } else if (a.brand.startsWith(b.brand) || b.brand.startsWith(a.brand)) {
      // "amulgold" vs "amul" — related but not identical.
      brandSignal = 0.6;
    } else {
      brandSignal = 0;
    }
  }

  // --- Pack size: the safety gate ---
  const packCompat = comparePackSizes(a.pack, b.pack);
  const packSignal = PACK_SCORES[packCompat];
  const packMismatch = packCompat === 'off';

  // --- Lexical similarity over the full normalised string ---
  const lexical = diceBigrams(a.normalized, b.normalized);

  // --- Content-word agreement, ignoring the brand ---
  const agreement = contentAgreement(a.content, b.content);
  const content = agreement === null ? NO_CONTENT_SIGNAL : agreement;

  const signals = { brand: brandSignal, pack: packSignal, lexical, content };

  let score =
    WEIGHTS.brand * brandSignal +
    WEIGHTS.pack * packSignal +
    WEIGHTS.lexical * lexical +
    WEIGHTS.content * content;

  // A hard quantity mismatch can never be a confident match, regardless of how
  // similar the words look. "Amul Milk 500ml" vs "Amul Milk 1L" scores high on
  // every lexical signal but is a different purchase.
  if (packMismatch) score = Math.min(score, 0.35);

  // Different brands are a strong negative signal even when the rest of the
  // title lines up ("Britannia Good Day" vs "Parle-G Gold Kaju").
  if (a.brand && b.brand && !brandMatch && brandSignal === 0) {
    score = Math.min(score, 0.4);
  }

  // Same brand and the same quantity is close to proof of identity on its own;
  // whatever words remain are descriptors ("Soft Drink", "Lemon Lime"). That
  // case is common — platforms routinely drop or add qualifiers — and without
  // this floor a bare canonical title never clears the threshold against a
  // verbose listing.
  //
  // It is deliberately NOT applied when the two titles both carry content words
  // and mostly disagree, which is exactly the "Amul Gold" vs "Amul Taaza"
  // situation: same brand, same size, genuinely different products.
  if (brandMatch && (packCompat === 'exact' || packCompat === 'close')) {
    const noConflict = agreement === null || agreement >= 0.5;
    if (noConflict) score = Math.max(score, 0.8);
  }

  score = clamp01(score);

  return {
    score,
    packMismatch,
    brandMatch,
    signals,
    reason: explain(a, b, packCompat, brandMatch),
  };
}

function explain(
  a: NormalizedTitle,
  b: NormalizedTitle,
  packCompat: PackCompatibility,
  brandMatch: boolean,
): string {
  const parts: string[] = [];
  parts.push(brandMatch ? 'same brand' : a.brand && b.brand ? 'different brand' : 'brand unverified');

  if (packCompat === 'exact') parts.push('identical pack size');
  else if (packCompat === 'close') parts.push('near-identical pack size');
  else if (packCompat === 'off') parts.push('different pack size');
  else parts.push('pack size unconfirmed');

  return parts.join(' · ');
}

/** Format a confidence for display. */
export function describeConfidence(score: number): { label: string; tone: 'high' | 'medium' | 'low' } {
  if (score >= 0.85) return { label: 'High confidence match', tone: 'high' };
  if (score >= AUTO_MATCH_THRESHOLD) return { label: 'Likely same product', tone: 'medium' };
  return { label: 'Weak match', tone: 'low' };
}
