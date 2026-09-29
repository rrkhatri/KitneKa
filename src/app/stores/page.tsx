import { StoreLocator } from '@/components/StoreLocator';
import { normalisePincode } from '@/lib/pincode/resolve';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Find the nearest dark store',
  description:
    'Enter your pincode to see which quick-commerce platform is closest, and which stores deliver to you.',
};

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ pincode?: string }>;
}) {
  // Read from the URL so the picker and the geolocation button can both hand
  // off through a plain link or form submit, with no client state involved.
  const params = await searchParams;
  const initialPincode = normalisePincode(params.pincode ?? '');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Find your nearest store
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">
        Quick commerce is a neighbourhood business. Enter your pincode or share your
        location, and we&apos;ll work out which platform has a fulfilment centre close
        enough to serve you, how far it is, and the delivery time it implies.
      </p>

      <div className="mt-8">
        <StoreLocator initialPincode={initialPincode} />
      </div>
    </div>
  );
}
