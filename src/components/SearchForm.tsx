'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePincode } from './PincodeProvider';
import { LocateButton } from './LocateButton';
import { SUGGESTED_QUERIES } from '@/data/catalog';

/**
 * The search form is a REAL HTML form that GETs /search.
 *
 * This is deliberate. A form driven only by React state has no fallback: if the
 * client bundle is slow, blocked or erroring, the page renders beautifully and
 * then does nothing at all when you click. With a native `action` the form
 * submits to the server whether or not a single line of JavaScript ran, and the
 * `onSubmit` handler below merely upgrades that to a client-side navigation
 * when it can. Progressive enhancement, in the direction that matters.
 *
 * The same rule is why the Compare button is never `disabled` — an input the
 * user cannot type into looks broken when the wiring fails, and a real submit
 * always has a defined outcome.
 */
export function SearchForm({
  defaultQuery = '',
  size = 'lg',
  showPincode = true,
}: {
  defaultQuery?: string;
  size?: 'lg' | 'md';
  showPincode?: boolean;
}) {
  const router = useRouter();
  const { pincode, setPincode } = usePincode();
  const [query, setQuery] = useState(defaultQuery);
  const [draftPincode, setDraftPincode] = useState<string | null>(null);

  const shownPincode = draftPincode ?? pincode;
  const large = size === 'lg';

  function submit(e: React.FormEvent<HTMLFormElement>) {
    // Only take over when the client side is genuinely working.
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const next = shownPincode.replace(/\D/g, '').slice(0, 6);
    setPincode(next);
    setDraftPincode(null);

    const params = new URLSearchParams({ q });
    if (next) params.set('pincode', next);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form action="/search" method="get" onSubmit={submit} className="w-full">
      {/* Carries the values on a native GET submit. Hidden because the visible
          inputs are controlled and would otherwise duplicate the params. */}
      <input type="hidden" name="q" value={query} />
      <input type="hidden" name="pincode" value={shownPincode} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="product"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a product — Amul milk, Maggi, Colgate…"
            aria-label="Search a product"
            enterKeyHint="search"
            className={`w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
              large ? 'py-3.5 text-base' : 'py-2.5 text-[15px]'
            }`}
          />
        </div>

        {showPincode && (
          <div className="relative sm:w-44">
            <div className="relative">
              <input
                inputMode="numeric"
                autoComplete="postal-code"
                value={shownPincode}
                onChange={(e) => setDraftPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Pincode"
                aria-label="Delivery pincode"
                className={`tabular w-full rounded-xl border border-ink-200 bg-white pl-3 pr-10 text-center outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
                  large ? 'py-3.5 text-base' : 'py-2.5 text-[15px]'
                }`}
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2">
                <LocateButton compact />
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`rounded-xl bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700 ${
            large ? 'px-7 py-3.5 text-base' : 'px-5 py-2.5 text-[15px]'
          }`}
        >
          Compare
        </button>
      </div>
    </form>
  );
}

/**
 * Suggestions are real links, not buttons with a click handler, so they are
 * reachable and they work before — or entirely without — hydration.
 */
export function SuggestionChips() {
  const { pincode } = usePincode();

  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUERIES.map((s) => {
        const params = new URLSearchParams({ q: s });
        if (pincode) params.set('pincode', pincode);
        return (
          <Link
            key={s}
            href={`/search?${params.toString()}`}
            className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
          >
            {s}
          </Link>
        );
      })}
    </div>
  );
}
