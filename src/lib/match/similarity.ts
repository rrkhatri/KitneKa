/**
 * Similarity primitives used by the product matcher.
 */

/** Sørensen–Dice coefficient over character bigrams.
 *  Robust to word reordering and small typos, which is exactly the variance we
 *  see between platform titles. */
export function diceBigrams(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };

  const ga = grams(a);
  const gb = grams(b);

  let overlap = 0;
  let totalA = 0;
  let totalB = 0;
  for (const count of ga.values()) totalA += count;
  for (const count of gb.values()) totalB += count;

  for (const [g, count] of ga) {
    const other = gb.get(g);
    if (other) overlap += Math.min(count, other);
  }

  return (2 * overlap) / (totalA + totalB);
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Clamp helper. */
export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
