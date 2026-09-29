import { NextResponse } from 'next/server';
import { findServiceabilityIn, serviceabilityForAll } from '@/lib/pincode/darkStore';
import { resolvePincode } from '@/lib/pincode/resolve';
import { DARK_STORES } from '@/data/darkStores';
import { PLATFORM_ORDER } from '@/lib/platforms';
import type { PlatformId } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = new Set<string>(PLATFORM_ORDER);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode')?.trim() ?? '';
  const platformParam = searchParams.get('platform')?.trim();

  const location = resolvePincode(pincode);

  if (!location.resolved) {
    return NextResponse.json(
      {
        pincode,
        resolved: false,
        message: location.reason,
      },
      { status: 400 },
    );
  }

  // A single platform was asked for: return just that one, nearest store first.
  if (platformParam) {
    if (!VALID_PLATFORMS.has(platformParam)) {
      return NextResponse.json(
        { error: 'unknown_platform', message: `Unknown platform "${platformParam}".` },
        { status: 400 },
      );
    }

    const platform = platformParam as PlatformId;
    const serviceability = findServiceabilityIn(DARK_STORES, platform, location);

    return NextResponse.json({ location, serviceability });
  }

  const serviceabilities = serviceabilityForAll(DARK_STORES, location, PLATFORM_ORDER).sort((a, b) => {
    if (a.serviceable !== b.serviceable) return a.serviceable ? -1 : 1;
    return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
  });

  return NextResponse.json({ location, serviceabilities });
}
