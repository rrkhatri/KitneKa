/** Pack size parsing and comparison. */

export type PackSize = {
  value: number;
  /** Unit as written, already lowercased. May be 'l', 'cl', 'kg', 'ml', 'g', 'pc'. */
  unit: string;
};

type BaseUnit = 'ml' | 'g' | 'pc';

/**
 * Multiplier from a written unit to its base unit.
 *
 * Without this, "0.5 L" and "500 ml" are treated as different products — which
 * is exactly the kind of silent mismatch that shows a shopper a 1-litre price
 * next to a 500 ml price and calls it a comparison.
 */
const TO_BASE: Record<string, { base: BaseUnit; factor: number }> = {
  ml: { base: 'ml', factor: 1 },
  cl: { base: 'ml', factor: 10 },
  l: { base: 'ml', factor: 1000 },
  g: { base: 'g', factor: 1 },
  gm: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  pc: { base: 'pc', factor: 1 },
  pcs: { base: 'pc', factor: 1 },
  piece: { base: 'pc', factor: 1 },
  pieces: { base: 'pc', factor: 1 },
  nos: { base: 'pc', factor: 1 },
  count: { base: 'pc', factor: 1 },
  cts: { base: 'pc', factor: 1 },
  pad: { base: 'pc', factor: 1 },
  pads: { base: 'pc', factor: 1 },
  bottle: { base: 'pc', factor: 1 },
  bottles: { base: 'pc', factor: 1 },
  pack: { base: 'pc', factor: 1 },
};

export function canonicalUnit(unit: string): BaseUnit {
  return TO_BASE[unit]?.base ?? 'pc';
}

/** Convert to the base unit, scaling the value. */
export function toBase(pack: PackSize): PackSize {
  const entry = TO_BASE[pack.unit] ?? { base: 'pc' as BaseUnit, factor: 1 };
  return { value: pack.value * entry.factor, unit: entry.base };
}

/**
 * How compatible two pack sizes are.
 *
 * exact:  identical measurement after conversion.
 * close:  within 5% — e.g. 495ml vs 500ml, common with bottled goods.
 * off:    genuinely different sizes, e.g. 500ml vs 1L. This must not match.
 * unknown: one or both could not be determined, or the units are unrelated.
 */
export type PackCompatibility = 'exact' | 'close' | 'off' | 'unknown';

export function comparePackSizes(a: PackSize | null, b: PackSize | null): PackCompatibility {
  if (!a || !b) return 'unknown';

  const ca = toBase(a);
  const cb = toBase(b);

  // A count-vs-volume mismatch (e.g. "6 pack" vs "500ml") is a soft signal:
  // one may describe the other, so we neither confirm nor hard-reject.
  if (ca.unit !== cb.unit) return 'unknown';

  const delta = Math.abs(ca.value - cb.value);
  if (delta === 0) return 'exact';

  const rel = delta / Math.max(ca.value, cb.value);
  if (rel <= 0.05) return 'close';

  return 'off';
}
