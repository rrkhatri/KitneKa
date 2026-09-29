'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PincodePicker } from './PincodeChip';
import { LocateButton } from './LocateButton';
import { usePincode } from './PincodeProvider';
import { getPlatform } from '@/lib/platforms';
import type { PincodeLocationResolved, Serviceability } from '@/lib/types';

/** The API only returns a location for a pincode it could actually resolve. */
type PincodeResponse = {
  location: PincodeLocationResolved;
  serviceabilities: Serviceability[];
};

export function StoreLocator({ initialPincode = '' }: { initialPincode?: string }) {
  const { pincode, setPincode } = usePincode();
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  // The result is tagged with the pincode it was fetched for, so switching
  // pincode immediately derives to "no data yet" instead of briefly showing the
  // previous pincode's stores — and `loading` becomes a derivation rather than
  // a flag that has to be kept in sync by hand.
  const [result, setResult] = useState<{ pincode: string; data: PincodeResponse } | null>(null);
  const [error, setError] = useState<{ pincode: string; message: string } | null>(null);

  // A pincode arriving in the URL (picker form submit, deep link) is adopted
  // into the store so the header and the form agree.
  useEffect(() => {
    if (initialPincode) setPincode(initialPincode);
  }, [initialPincode, setPincode]);

  useEffect(() => {
    if (!pincode) return;

    let cancelled = false;

    fetch(`/api/pincode?pincode=${pincode}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? 'Could not resolve that pincode.');
        return body as PincodeResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setResult({ pincode, data });
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError({ pincode, message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [pincode]);

  const data = result?.pincode === pincode ? result.data : null;
  const currentError = error?.pincode === pincode ? error.message : null;
  const loading = Boolean(pincode) && !data && !currentError;

  const serviceable = data?.serviceabilities.filter((s) => s.serviceable) ?? [];
  const notServiceable = data?.serviceabilities.filter((s) => !s.serviceable) ?? [];

  function commit(next: string) {
    setPincode(next);
    setShowPicker(false);
    // Keep the URL in step so the result is shareable and survives a reload.
    router.replace(next ? `/stores?pincode=${next}` : '/stores');
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {showPicker ? (
          <PincodePicker value={pincode} autoFocus onCommit={commit} />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-medium text-ink-700">Your pincode</p>
              <p className="tabular mt-0.5 text-2xl font-bold text-ink-900">
                {pincode || 'Not set'}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <LocateButton onLocated={(p) => commit(p)} />
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900"
              >
                {pincode ? 'Change' : 'Enter pincode'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-ink-500">Locating stores…</p>}
      {currentError && <p className="mt-4 text-sm text-amber-700">{currentError}</p>}

      {data && !loading && (
        <>
          <p className="mt-6 text-sm text-ink-600">
            {data.location.locality}, {data.location.city}
            {data.location.precision === 'zone-centroid' && (
              <span className="text-ink-400">
                {' '}
                · approximate, we don&apos;t have an exact map point for this pincode
              </span>
            )}
          </p>

          {serviceable.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {serviceable.map((s) => (
                <ServiceabilityCard key={s.platform} serviceability={s} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              None of the platforms we track delivers to {pincode} yet.
            </p>
          )}

          {notServiceable.length > 0 && (
            <details className="mt-4 rounded-xl border border-ink-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink-700">
                {notServiceable.length} platform{notServiceable.length === 1 ? '' : 's'} not
                delivering here
              </summary>
              <ul className="divide-y divide-ink-100 border-t border-ink-100">
                {notServiceable.map((s) => (
                  <li key={s.platform} className="px-4 py-2.5 text-sm text-ink-600">
                    <span className="font-medium text-ink-800">{getPlatform(s.platform).name}</span>{' '}
                    — {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function ServiceabilityCard({ serviceability }: { serviceability: Serviceability }) {
  const meta = getPlatform(serviceability.platform);
  const store = serviceability.darkStore;

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: meta.accent }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-[15px] font-semibold text-ink-900">{meta.name}</h2>
            <p className="tabular text-sm text-ink-500">{serviceability.distanceKm} km away</p>
          </div>

          {store && (
            <p className="mt-1 text-sm text-ink-600">
              {store.name} · {store.locality}
            </p>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-ink-400">Delivery estimate</dt>
              <dd className="tabular mt-0.5 font-semibold text-ink-900">
                {serviceability.etaMinutes} min
              </dd>
            </div>
            <div>
              <dt className="text-ink-400">Store pincode</dt>
              <dd className="tabular mt-0.5 font-semibold text-ink-900">{store?.pincode}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Service radius</dt>
              <dd className="tabular mt-0.5 font-semibold text-ink-900">
                {store?.serviceRadiusKm} km
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </li>
  );
}
