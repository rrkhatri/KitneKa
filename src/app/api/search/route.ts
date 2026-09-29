import { NextResponse } from 'next/server';
import { compareProduct } from '@/lib/search';
import { SUGGESTED_QUERIES } from '@/data/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const pincode = searchParams.get('pincode')?.trim() || null;

  if (!query) {
    return NextResponse.json(
      { error: 'missing_query', message: 'Provide a product to search for.', suggestions: SUGGESTED_QUERIES },
      { status: 400 },
    );
  }

  try {
    const result = await compareProduct(query, {
      pincode,
      signal: request.signal,
    });

    if (!result) {
      return NextResponse.json(
        {
          error: 'no_listings',
          message: `No platform returned a listing for "${query}".`,
          query,
          suggestions: SUGGESTED_QUERIES,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'comparison_failed',
        message: err instanceof Error ? err.message : 'Comparison failed.',
      },
      { status: 500 },
    );
  }
}
