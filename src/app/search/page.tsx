import { OfferCard } from '@/components/OfferCard';
import { SearchForm, SuggestionChips } from '@/components/SearchForm';
import { formatPrice } from '@/lib/money';
import { compareProduct } from '@/lib/search';
import { getPlatform } from '@/lib/platforms';
import { isValidPincode, resolvePincode } from '@/lib/pincode/resolve';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ q?: string; pincode?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return { title: q ? `${q} — price comparison` : 'Price comparison' };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const pincode = (params.pincode ?? '').trim();

  const result = await compareProduct(query, { pincode: pincode || null });
  const location = pincode ? resolvePincode(pincode) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 max-w-2xl">
        <SearchForm defaultQuery={query} size="md" />
      </div>

      {pincode && isValidPincode(pincode) && location?.resolved && (
        <p className="mb-5 text-sm text-ink-600">
          Showing what is deliverable to{' '}
          <span className="tabular font-semibold text-ink-900">{pincode}</span>
          {location.locality !== `${location.city} area` && (
            <>
              {' '}
              · {location.locality}, {location.city}
            </>
          )}
        </p>
      )}

      {pincode && location && !location.resolved && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {location.reason} Prices below are shown without delivery checks.
        </div>
      )}

      {!query ? (
        <EmptyState
          title="Search for a product to compare"
          body="Type anything you would buy on a quick-commerce app."
        />
      ) : !result ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-ink-900">No listings found for “{query}”</h1>
          <p className="mt-1.5 text-sm text-ink-600">
            None of the platforms we track returned this product. That usually means the item is
            not carried on quick commerce, or no platform we track serves your area yet. Connect a
            live feed to widen the catalogue.
          </p>
          <div className="mt-4">
            <SuggestionChips />
          </div>
        </div>
      ) : (
        <Comparison result={result} />
      )}
    </div>
  );
}

function Comparison({ result }: { result: NonNullable<Awaited<ReturnType<typeof compareProduct>>> }) {
  const { product, offers, cheapest, spreadPaise, unavailablePlatforms, allSeed, identitySource } =
    result;
  const buyable = offers.filter((o) => o.inStock);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {[product.brand, product.packSize, product.category].filter(Boolean).join(' · ')}
        </p>

        {identitySource === 'consensus' && (
          <p className="mt-2 text-xs text-ink-500">
            Not in our curated catalogue — this match was derived by comparing what the
            platforms return for your search, and agreed on by{' '}
            <span className="font-semibold text-ink-700">{product.platformCount} platforms</span>.
          </p>
        )}

        {cheapest && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm text-brand-800">
              <span className="font-semibold">{getPlatform(cheapest.platform).name}</span> is the
              cheapest at{' '}
              <span className="tabular font-bold">{formatPrice(cheapest.pricePaise)}</span>
              {cheapest.etaMinutes > 0 && (
                <>
                  {' '}
                  with delivery in{' '}
                  <span className="tabular font-semibold">{cheapest.etaMinutes} min</span>
                </>
              )}
              {spreadPaise > 0 && (
                <>
                  {' '}
                  — you save{' '}
                  <span className="tabular font-semibold">{formatPrice(spreadPaise)}</span> against
                  the dearest option
                </>
              )}
              .
            </p>
          </div>
        )}
      </header>

      {allSeed && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-xs text-ink-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-ink-400">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>
            These are <strong className="font-semibold text-ink-700">reference prices</strong> from
            the bundled catalogue, not live quotes. Set{' '}
            <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[11px]">
              QUICKCOMMERCE_FEED_URL
            </code>{' '}
            to plug in a live feed — every card is labelled with its source.
          </p>
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          {buyable.length} platform{buyable.length === 1 ? '' : 's'} available
        </h2>
        <p className="text-xs text-ink-400">Sorted by price, lowest first</p>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          title="No matching listings"
          body="We could not find this product on any platform right now."
        />
      ) : (
        <ol className="space-y-3">
          {offers.map((offer, index) => (
            <OfferCard
              key={`${offer.platform}-${offer.platformProductId}`}
              offer={offer}
              rank={index + 1}
              isCheapest={buyable.length > 0 && index === 0 && offer.inStock}
              cheapestPricePaise={cheapest?.pricePaise ?? offer.pricePaise}
            />
          ))}
        </ol>
      )}

      {unavailablePlatforms.length > 0 && (
        <details className="mt-6 rounded-xl border border-ink-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink-700">
            {unavailablePlatforms.length} platform
            {unavailablePlatforms.length === 1 ? '' : 's'} not shown
          </summary>
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {unavailablePlatforms.map(({ platform, reason }) => (
              <li key={platform} className="px-4 py-2.5 text-sm text-ink-600">
                <span className="font-medium text-ink-800">
                  {getPlatform(platform).name}
                </span>{' '}
                — {reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ink-800">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </div>
  );
}
