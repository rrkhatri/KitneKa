import { NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/providers/registry';
import { getCaches } from '@/lib/search';
import { SEED_CATALOG } from '@/data/catalog';
import { DARK_STORES } from '@/data/darkStores';
import { PINCODE_LOCATIONS } from '@/data/pincodes';

export const dynamic = 'force-dynamic';

/**
 * Operational endpoint. Answers the only question that matters when this app
 * misbehaves: "am I looking at live prices or the bundled catalogue, and which
 * upstreams are degraded right now?"
 */
export async function GET() {
  const { listingCache, storeCache } = getCaches();

  return NextResponse.json({
    status: 'ok',
    dataSource: ADAPTERS.some((a) => a.id !== 'seed' && a.isConfigured()) ? 'mixed' : 'seed',
    adapters: ADAPTERS.map((a) => ({
      id: a.id,
      description: a.description,
      configured: a.isConfigured(),
    })),
    catalogue: {
      products: SEED_CATALOG.length,
      darkStores: DARK_STORES.length,
      pincodes: Object.keys(PINCODE_LOCATIONS).length,
    },
    cache: {
      listings: listingCache.getStats(),
      stores: storeCache.getStats(),
    },
  });
}
