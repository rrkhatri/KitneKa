# KitneKa

**How much is it really?** — search a product, see the same product on every Indian
quick-commerce platform, sorted cheapest first, with delivery times resolved for
your pincode.

Compares **Blinkit · Zepto · Swiggy Instamart · Amazon Fresh · Flipkart Minutes**.

---

## The data problem, stated plainly

There is an important constraint that shapes this entire codebase:

> **None of these five platforms expose a public product or pricing API.**

Their catalogues, prices, stock and dark-store locations are all server-side,
scoped to a signed-in user and a delivery location. There is no endpoint you can
call to ask "what does Amul Taaza 500ml cost on Blinkit in Vadodara right now".

The industry gets this data by scraping or by licensing it from a data partner.
So this repo does what a production team would actually do:

1. **Build the entire product** — matching, sorting, serviceability, UI — against
   an adapter interface that is independent of where data comes from.
2. **Ship a realistic bundled dataset** so the app is fully functional and
   demonstrable today, with every price labelled for what it is.
3. **Ship the live integration point**, a single HTTP adapter wired to an
   environment variable, which is where a licensed feed or your own scraper
   sidecar plugs in — no UI or domain changes required.

### Why the app never shows a stale price as if it were live

Every offer carries a `source` of `live` or `seed`, and the UI renders a badge
for it (`Live` / `Reference`). A comparison that quietly mixes yesterday's
catalogue prices into a live answer is worse than no answer, because the shopper
will act on it. If the live feed is down, the app degrades to reference prices
and *says so*, per platform.

---

## Quick start

```bash
npm ci            # node_modules is not persisted between sandbox sessions
npm run dev       # http://localhost:3000
```

No configuration, no API keys, no database. Try:

- `Amul Taaza Milk` with pincode `390007` (Gotri, Vadodara)
- `Coca-Cola` with pincode `400072` (Malad East, Mumbai) — four of five deliver
- Anything the feed carries, even if this app has never heard of it

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm test` | 45 tests — unit, matching, and real hydration/interaction (`node:test`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |

---

## It works without JavaScript

This is a deliberate constraint, not a nicety. The first version of this app
rendered perfect HTML and then did nothing when you clicked: the Compare button
was stuck disabled, the suggestion chips were inert, the pincode button did
nothing. Every one of those was a control whose entire behaviour lived in React
state, so a single client-side failure turned the page into a pretty dead end.

So the primary actions are now plain HTML, and JavaScript only upgrades them:

| Control | Without JS | With JS |
| --- | --- | --- |
| Search + Compare | `<form action="/search" method="get">` submits natively | client-side navigation, no reload |
| Suggestion chips | real `<a href="/search?q=…">` links | same links, faster |
| Header pincode | real `<a href="/stores">` | also opens the picker |
| Pincode entry | real `<form action="/stores">` | same |

The Compare button is **never** `disabled`. A control the user cannot operate
looks broken the moment wiring fails, and the form has a defined outcome
either way.

`tests/interaction.test.tsx` renders the real components, hydrates them, and
performs the gestures — typing, clicking, submitting — so this contract cannot
regress silently.

---

## Architecture

```
  UI (Next.js App Router, server components)
    │
    ▼
  lib/search.ts  ── the orchestrator ─────────────────────────┐
    │  1. resolve query → canonical product                  │
    │  2. fan out to all 5 platforms (parallel)              │
    │  3. match every listing back to the canonical product  │
    │  4. resolve pincode → nearest serving dark store       │
    │  5. build offers, sort cheapest-first                  │
    │                                                        │
    ▼                                                        │
  lib/providers/registry.ts  ── the chain ───────────────────┘
    │   1. remoteFeedAdapter   (live, when configured)
    │   2. seedAdapter         (bundled, always available)
    │
    ▼
  lib/match/*        product identity across platforms
  lib/pincode/*      geography and dark-store resolution
  lib/cache.ts       TTL cache with stale-while-revalidate
```

### Adapter chain

Every data source implements `ProviderAdapter` (`src/lib/providers/types.ts`).
The app only ever talks to adapters through it, so a new source cannot quietly
change how matching or sorting behaves.

```
platform  ──▶  remoteFeed.search()   ──fail?──▶  seedAdapter.search()
             timeout / 4xx / 5xx
             rate limit / bad shape
```

A failure on one platform degrades **only that platform** to reference prices.
The other four still return live data. Every degradation is recorded and
surfaced at `GET /api/health`.

### Money

All money is **integer paise**, everywhere, including across the feed boundary.
Floating-point rupees are never used for comparison or arithmetic — a price
comparison app that is off by a paisa on a tie-break cannot be trusted, and
`0.1 + 0.2 !== 0.3` is not an acceptable foundation for a sorting claim.

---

## Product matching

The hard part of this product is deciding that two listings are the *same
physical product*. The platforms title them differently:

| Platform | Title |
| --- | --- |
| Blinkit | `Amul Taaza Toned Milk 500 ml` |
| Zepto | `Amul Taaza Toned Milk, 500ml` |
| Instamart | `Amul Taaza Milk 500 ml` |
| Amazon Fresh | `Amul Gold Milk, 0.5 L` |

`src/lib/match/` reduces a title to three comparable signals — **brand**,
**pack size** and a bag of **content words** — and combines them. The design
principle is that **a wrong "same product" match is far more damaging than a
missed one**, because it reports a price for something the shopper would not
receive. So:

- **Pack size is a gate, not a feature.** `Amul Milk 500ml` vs `Amul Milk 1L`
  scores high on every lexical signal but is capped below the match threshold.
  Units are converted, so `0.5 L` and `500 ml` are the same product and
  `1 kg` and `1000 g` are the same product.
- **Multipliers are folded in.** `10 x 20 g` becomes `200 g`, so a 200 g listing
  matches — which is how a shopper reads it.
- **Unconfident matches are dropped, not shown with a low score.** A platform
  that did not match is reported in a "not shown" panel with the reason, rather
  than being quietly omitted.
- **Same brand + same quantity is close to proof** — unless both titles carry
  content words that mostly disagree, which is exactly `Amul Gold` vs
  `Amul Taaza`: same brand, same size, genuinely different products.

Both directions are covered by tests, so the rule cannot silently drift.

### Any product, not a fixed list

An earlier version anchored every search on a row in a bundled catalogue, which
meant the app could only ever compare products someone had thought to hard-code.
That is a demo, not a product.

Identity is now established in two ways:

1. **Catalogue** — a curated record is used when the query matches it well. It
   is trusted only above a relevance threshold; a loose match is discarded
   rather than allowed to attach a confident-looking price table to the wrong
   product. (This is why "Suhana Masala Diya" no longer resolves to *Maggi
   Masala-ae-Magic* just because both contain the word "masala".)
2. **Consensus** (`src/lib/match/consensus.ts`) — otherwise the platforms decide.
   Every platform is queried, the listings are clustered by mutual agreement on
   brand, pack size and wording, and the cluster that the most platforms agree on
   *is* the product. The cluster's most central title becomes the anchor.

With a feed connected this is what makes the catalogue effectively open-ended: a
product nobody here has heard of still gets a correct, price-sorted comparison.
The UI says which route was taken, so a discovered match is never passed off as
a curated one.

---

## Pincode, location and dark stores

A "dark store" is the small fulfilment centre a platform dispatches from. A
pincode is serviceable when it falls inside the service radius of one of that
platform's stores; we pick the **nearest** one, because that is the store that
will actually fulfil the order and it determines the delivery estimate.

```
pincode → location (haversine) → nearest store within radius → ETA
```

- **Exact pincode** where known, falling back to the **3-digit postal zone
  centroid**, flagged as `zone-centroid` so the UI can say the nearest-store
  answer is approximate rather than implying false precision.
- **Coverage is deliberately uneven** — Flipkart Minutes is concentrated where
  Flipkart's own supply chain is dense; Instamart is strong in Ahmedabad and
  the south. The app surfaces that honestly ("does not deliver to 390007 yet")
  instead of pretending coverage is uniform.

### "Use my location"

The **📍 Use my location** button calls `navigator.geolocation`, then resolves
the fix to an Indian pincode by finding the nearest entry in the postal dataset
(`src/lib/geo/nearest.ts`).

Resolving locally rather than calling a hosted reverse-geocoding API is
deliberate: it needs no key or quota, it cannot fail on a network round-trip,
it never sends a precise location to a third party, and it returns a *pincode*,
which is what the delivery check actually needs — a neighbourhood name from a
generic geocoder would not do. A phone's GPS is accurate to roughly 10–30 m,
far tighter than the distance between neighbouring pincodes, so
nearest-neighbour is the correct method.

### Swapping in real location data

`src/data/pincodes.ts` is a **curated starter dataset, not the authoritative
India Post directory**. It covers ~180 pincodes across 16 launch cities and is
isolated in that one file precisely so it can be replaced wholesale with an
official India Post PIN code export, or a licensed geospatial provider, without
touching any other module. A wider dataset directly improves both pincode entry
and the location button.

---

## Connecting a live feed

```bash
cp .env.example .env.local
# QUICKCOMMERCE_FEED_URL=https://your-feed.example.com
# QUICKCOMMERCE_FEED_TOKEN=...
```

The adapter is written against a **contract**, not against any one platform's
private API, so you can point it at whichever of these you actually have:

1. A licensed quick-commerce data partner — the intended use.
2. Your own scraper running as a **sidecar**. This is the shape we recommend if
   you go the scraping route: sessions, proxy rotation and parsing stay out of
   the web app, so a platform's anti-bot change degrades a background job
   instead of taking down a page.
3. A future official platform API, if one is ever published.

### The contract

```
GET {base}/v1/platforms/{platform}/search?q={query}&pincode={pincode}
  → { "fetchedAt": "...", "listings": [
        { "id", "title", "imageUrl", "mrpPaise", "pricePaise",
          "inStock", "promoLabels", "packSize", "etaMinutes" } ] }

GET {base}/v1/platforms/{platform}/stores
  → { "stores": [ { "id", "name", "locality", "city", "pincode",
                    "lat", "lng", "baseEtaMinutes", "serviceRadiusKm" } ] }
```

Money is integer paise on both sides. Responses are validated at runtime — a
feed that starts returning a string where a number belongs fails loudly in the
adapter rather than rendering `₹NaN`.

### Anchoring live results

Today the canonical product identity comes from the bundled catalogue, which is
what lets us guarantee "same product" before quoting a price. With a live feed,
have the feed return its **own canonical entity id** for each listing
(`canonicalId`); anchor on that instead of on the bundled name. That is a
deliberate, narrow change to `resolveAnchor()` in `src/lib/search.ts` and nothing
else — the matcher, sorter and UI stay as they are.

---

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/search?q=&pincode=` | Full price comparison, sorted cheapest-first |
| `GET /api/pincode?pincode=[&platform=]` | Serviceability; nearest store per platform |
| `GET /api/locations?q=` | Pincode search for the picker |
| `GET /api/health` | Which adapters are live, catalogue size, cache stats |

---

## Testing

`npm test` covers the logic where a bug would be invisible but expensive.

**Interaction tests** (`tests/interaction.test.tsx`) render the real components,
hydrate them in jsdom, and type, click and submit. These exist because the three
bugs that prompted them passed every unit test and looked perfect in the HTML.

**Matching** covers pack-size extraction across every format the platforms
publish, unit conversion, the quantity gate, same-brand-different-variant
rejection, and a regression guard that every bundled listing still matches its
own catalogue record.

**Consensus** covers clustering, keeping different products apart, refusing to
merge different pack sizes, and comparing a product the catalogue has never
heard of.

**Providers** cover the chain falling through on both errors *and* empty
results, so a partial live feed cannot decide what the app can compare.

**Also covered:** price sorting, tie-breaking, out-of-stock ordering, pincode
resolution and serviceability, and GPS-to-pincode resolution against real
locality coordinates.

---

## Logos and product images

**Platform logos** are hand-built inline SVG recreations of each brand's real
mark (`src/components/PlatformLogo.tsx`). They ship in the bundle, request
nothing from the network, and scale cleanly. Swap in the official asset files
if your legal review prefers them.

**Product images** come from the feed: when a listing supplies `imageUrl`, that
photograph is rendered — which is the real requirement, since on these platforms
the image is how a product is recognised. Offline there is no photograph
available, so the app shows a category illustration rather than inventing one.
The images bundled in this environment could not be downloaded (the sandbox
blocks image hosts), and fabricating AI photographs of real branded goods would
be worse than an honest illustration. Point a feed at the app and real product
photos appear with no code change.

---

## Deliberate limitations

- **Bundled prices are authored reference values, not real prices.** They are
  realistic and internally consistent, and labelled `Reference` everywhere they
  appear.
- **The bundled catalogue is ~45 products.** It exists so the app works with no
  configuration. With a feed connected, consensus makes the effective catalogue
  as large as the platforms' own.
- **ETA is modelled** from store base time and distance, not live routing.
- **No auth, accounts, history or watchlist** — out of scope for v1.
- The cache is **in-process**, right for one Node process. Moving to Redis
  means keeping `TtlCache`'s `get`/`set` shape and moving the body out of
  memory.
