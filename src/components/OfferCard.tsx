import { getPlatform, buildDeepLink, buildWebUrl } from '@/lib/platforms';
import { discountPercent, formatPrice } from '@/lib/money';
import { describeConfidence } from '@/lib/match/match';
import { getDarkStore } from '@/lib/pincode/darkStore';
import type { Offer } from '@/lib/types';
import { PlatformLogo } from './PlatformLogo';
import { ProductImage } from './ProductImage';

export function OfferCard({
  offer,
  isCheapest,
  cheapestPricePaise,
  rank,
}: {
  offer: Offer;
  isCheapest: boolean;
  cheapestPricePaise: number;
  rank: number;
}) {
  const meta = getPlatform(offer.platform);
  const discount = discountPercent(offer.mrpPaise, offer.pricePaise);
  const store = offer.darkStoreId ? getDarkStore(offer.darkStoreId) : undefined;
  const confidence = describeConfidence(offer.matchConfidence);
  const deltaPaise = offer.pricePaise - cheapestPricePaise;

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border bg-white transition-shadow ${
        isCheapest && offer.inStock
          ? 'border-brand-300 shadow-[0_8px_24px_-12px_rgba(31,164,113,0.45)]'
          : 'border-ink-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      } ${offer.inStock ? '' : 'opacity-70'}`}
    >
      {isCheapest && offer.inStock && (
        <div className="flex items-center gap-2 bg-brand-600 px-4 py-1.5 text-[13px] font-semibold text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z" />
          </svg>
          Cheapest of the platforms we can deliver
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ProductImage
            src={offer.imageUrl || undefined}
            name={offer.title}
            className="h-16 w-16 shrink-0 rounded-xl border border-ink-100 bg-white"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="flex items-center gap-1.5">
                <PlatformLogo platform={offer.platform} size={18} />
                <span className="text-sm font-semibold text-ink-900">{meta.name}</span>
              </span>
              <span className="text-xs text-ink-400">{offer.listedPackSize}</span>
              <DataSourceBadge source={offer.source} />
            </div>

            <p className="mt-1.5 line-clamp-2 text-sm text-ink-600" title={offer.title}>
              {offer.title}
            </p>

            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="tabular text-2xl font-bold tracking-tight text-ink-900">
                {formatPrice(offer.pricePaise)}
              </span>
              {discount > 0 && (
                <>
                  <span className="tabular text-sm text-ink-400 line-through">
                    {formatPrice(offer.mrpPaise)}
                  </span>
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            {offer.inStock && !isCheapest && deltaPaise > 0 && (
              <p className="mt-1 text-xs text-ink-500">
                <span className="tabular font-medium text-ink-700">
                  {formatPrice(deltaPaise, { decimals: false })}
                </span>{' '}
                more than the cheapest
              </p>
            )}

            {offer.promoLabels.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {offer.promoLabels.map((label) => (
                  <li
                    key={label}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-100 pt-3.5 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-ink-400">Delivery</dt>
            <dd className="mt-0.5 font-medium text-ink-800">
              {offer.inStock ? (
                <span className="tabular">{offer.etaMinutes} min</span>
              ) : (
                <span className="text-ink-500">Unavailable</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-ink-400">Fulfilled by</dt>
            <dd className="mt-0.5 truncate font-medium text-ink-800" title={store?.name}>
              {store ? store.name : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Match</dt>
            <dd className="mt-0.5">
              <span
                className={`font-medium ${
                  confidence.tone === 'high'
                    ? 'text-brand-700'
                    : confidence.tone === 'medium'
                      ? 'text-amber-700'
                      : 'text-ink-500'
                }`}
              >
                {Math.round(offer.matchConfidence * 100)}% · {confidence.label}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-3.5 flex items-center gap-2">
          <a
            href={buildDeepLink(offer.platform, offer.title)}
            className="flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: meta.accent }}
          >
            Open in {meta.shortName}
          </a>
          <a
            href={buildWebUrl(offer.platform, offer.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
          >
            Web
          </a>
        </div>

        {!offer.inStock && (
          <p className="mt-2.5 rounded-lg bg-ink-100 px-3 py-2 text-xs text-ink-600">
            Out of stock at your nearest {meta.shortName} store right now.
          </p>
        )}

        <p className="mt-2 text-[11px] text-ink-400">Rank #{rank} · prices update throughout the day</p>
      </div>
    </li>
  );
}

export function DataSourceBadge({ source }: { source: 'live' | 'seed' }) {
  if (source === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500"
      title="Reference price from the bundled catalogue — connect a live feed for current prices and product photos."
    >
      Reference
    </span>
  );
}
