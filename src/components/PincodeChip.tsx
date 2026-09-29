'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePincode } from './PincodeProvider';
import { LocateButton } from './LocateButton';

type LocationEntry = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  covered: boolean;
};

/**
 * Header pincode control.
 *
 * The visible control is a real link to the store finder, so it always leads
 * somewhere even with no JavaScript. The dropdown it also opens is a pure
 * convenience layer on top.
 */
export function PincodeChip() {
  const { pincode, setPincode } = usePincode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Link
        href="/stores"
        onClick={(e) => {
          // Enhance into the picker when the client is alive; fall through to
          // a normal navigation when it is not.
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-ink-400">
          <path
            d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="tabular">{pincode || 'Add pincode'}</span>
      </Link>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-ink-200 bg-white p-3 shadow-lg">
          <PincodePicker
            value={pincode}
            onCommit={(next) => {
              setPincode(next);
              setOpen(false);
            }}
          />
          <div className="mt-3 border-t border-ink-100 pt-3">
            <LocateButton />
          </div>
        </div>
      )}
    </div>
  );
}

export function PincodePicker({
  value,
  onCommit,
  autoFocus = false,
}: {
  value: string;
  onCommit: (pincode: string) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    let cancelled = false;

    // The loading flag is set inside the debounce rather than at the top of the
    // effect: during the debounce no request is in flight, so showing
    // "Searching…" immediately would be a lie.
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('lookup failed');
        const data = (await res.json()) as { results: LocationEntry[] };
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const digits = query.replace(/\D/g, '').slice(0, 6);
  const valid = digits.length === 6;

  return (
    <div>
      <label htmlFor="pincode-input" className="block text-sm font-medium text-ink-700">
        Delivery pincode
      </label>
      <p className="mt-0.5 text-xs text-ink-500">
        We use this to find the nearest dark store and check what is deliverable.
      </p>

      <form action="/stores" method="get">
        <input type="hidden" name="pincode" value={digits} />
        <div className="mt-2 flex gap-2">
          <input
            id="pincode-input"
            ref={inputRef}
            name="pin"
            inputMode="numeric"
            autoComplete="postal-code"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="390007"
            className="tabular w-full rounded-lg border border-ink-200 px-3 py-2 text-base outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={!valid}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
          >
            Go
          </button>
        </div>
      </form>

      <div className="mt-2 max-h-56 overflow-y-auto">
        {loading && <p className="px-1 py-2 text-sm text-ink-400">Searching…</p>}

        {!loading && results.length === 0 && (
          <p className="px-1 py-2 text-sm text-ink-400">
            No match. You can still enter any valid 6-digit pincode.
          </p>
        )}

        <ul className="divide-y divide-ink-100">
          {results.map((r) => (
            <li key={r.pincode}>
              <button
                type="button"
                onClick={() => onCommit(r.pincode)}
                className="flex w-full items-center gap-2 px-1 py-2 text-left hover:bg-ink-50"
              >
                <span className="tabular w-14 shrink-0 text-sm font-semibold text-ink-900">
                  {r.pincode}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-700">{r.locality}</span>
                  <span className="block truncate text-xs text-ink-400">
                    {r.city}, {r.state}
                  </span>
                </span>
                {r.covered && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                    Covered
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {value && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onCommit('');
          }}
          className="mt-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
        >
          Clear
        </button>
      )}
    </div>
  );
}
