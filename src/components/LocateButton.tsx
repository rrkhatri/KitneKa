'use client';

import { useState } from 'react';
import { nearestPincode } from '@/lib/geo/nearest';
import { usePincode } from './PincodeProvider';

type State =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string };

/**
 * "Use my location" — fills the pincode from the device's GPS.
 *
 * Presented as a real form target too: the button degrades to a link to the
 * store finder when geolocation is unavailable or permission is refused, so
 * there is always a next step.
 */
export function LocateButton({
  compact = false,
  onLocated,
}: {
  compact?: boolean;
  onLocated?: (pincode: string) => void;
}) {
  const { setPincode } = usePincode();
  const [state, setState] = useState<State>({ status: 'idle' });

  function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({
        status: 'error',
        message: 'This browser cannot share your location. Please type your pincode instead.',
      });
      return;
    }

    setState({ status: 'locating' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = nearestPincode(position.coords.latitude, position.coords.longitude);
        if (!match) {
          setState({
            status: 'error',
            message: 'We could not work out your pincode from that location.',
          });
          return;
        }

        setPincode(match.pincode);
        onLocated?.(match.pincode);
        setState({
          status: 'done',
          message: `Using ${match.pincode} — ${match.locality}, ${match.city}`,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. You can still type your pincode.'
            : 'Could not get your location. Please type your pincode instead.';
        setState({ status: 'error', message });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const label = state.status === 'locating' ? 'Locating…' : 'Use my location';

  if (compact) {
    return (
      <button
        type="button"
        onClick={locate}
        disabled={state.status === 'locating'}
        title="Use my current location"
        aria-label="Use my current location"
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700 disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={state.status === 'locating' ? 'animate-pulse' : undefined}
        >
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={locate}
        disabled={state.status === 'locating'}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {label}
      </button>

      {state.status === 'done' && (
        <p className="mt-2 text-xs text-brand-700">{state.message}</p>
      )}
      {state.status === 'error' && (
        <p className="mt-2 text-xs text-amber-700">{state.message}</p>
      )}
    </div>
  );
}
