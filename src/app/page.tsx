import { SearchForm, SuggestionChips } from '@/components/SearchForm';
import { PlatformLogo } from '@/components/PlatformLogo';
import { PLATFORM_ORDER, PLATFORMS } from '@/lib/platforms';
import { COVERED_CITIES } from '@/data/darkStores';

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
            10-minute delivery, five apps, one price check
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            How much is it really?
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">
            Search any product and we line up the same item across every quick-commerce app,
            cheapest first — with the nearest store and delivery time for your pincode.
          </p>

          <div className="mt-7 max-w-2xl">
            <SearchForm />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              Try
            </p>
            <SuggestionChips />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Platforms compared
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_ORDER.map((id) => {
            const meta = PLATFORMS[id];
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4"
              >
                <PlatformLogo platform={id} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{meta.name}</p>
                  <p className="truncate text-xs text-ink-500">
                    Free delivery above{' '}
                    <span className="tabular">₹{(meta.freeDeliveryAbovePaise / 100).toFixed(0)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-900">Where we cover</h2>
          <p className="mt-1 text-sm text-ink-600">
            Dark store networks are dense in metros and patchy in tier-2 cities — that is why
            your pincode matters. Coverage today:{' '}
            <span className="font-medium text-ink-800">
              {COVERED_CITIES.length} cities
            </span>
            .
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {COVERED_CITIES.map((city) => (
              <li
                key={city}
                className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600"
              >
                {city}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
