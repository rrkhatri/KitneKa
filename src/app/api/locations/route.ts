import { NextResponse } from 'next/server';
import { FEATURED_PINCODES, PINCODE_LOCATIONS } from '@/data/pincodes';
import { COVERED_CITIES } from '@/data/darkStores';

export const dynamic = 'force-dynamic';

type Entry = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  /** True when at least one platform has a dark store in this city. */
  covered: boolean;
};

/** Powers the pincode picker: suggestions plus searchable coverage. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim().toLowerCase();

  const all: Entry[] = Object.values(PINCODE_LOCATIONS).map((r) => ({
    pincode: r.pincode,
    locality: r.locality,
    city: r.city,
    state: r.state,
    covered: COVERED_CITIES.includes(r.city),
  }));

  // Featured pincodes first so the common cities are one tap away, then
  // filtered search. Any Indian pincode can still be typed in directly.
  const featured = new Set(FEATURED_PINCODES);
  const results = all
    .filter((e) =>
      !query
        ? featured.has(e.pincode)
        : e.pincode.startsWith(query) ||
          e.city.toLowerCase().includes(query) ||
          e.locality.toLowerCase().includes(query),
    )
    .sort((a, b) => {
      if (!query) return Number(featured.has(b.pincode)) - Number(featured.has(a.pincode));
      const scoreA = (a.covered ? 2 : 0) + (a.pincode.startsWith(query) ? 1 : 0);
      const scoreB = (b.covered ? 2 : 0) + (b.pincode.startsWith(query) ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 25);

  return NextResponse.json({
    results,
    cities: COVERED_CITIES,
    total: all.length,
  });
}
