/**
 * Core domain types.
 *
 * Money is ALWAYS stored as an integer number of paise (1 rupee = 100 paise).
 * Floating point rupees are never used for comparison or arithmetic, because a
 * price comparison app that is off by 0.01 on a tie-break is a product that
 * cannot be trusted.
 */

export type PlatformId =
  | 'blinkit'
  | 'zepto'
  | 'instamart'
  | 'amazon_fresh'
  | 'flipkart_minutes';

/** Where a given price actually came from. Surfaced in the UI so the user is
 *  never shown a seeded catalogue price dressed up as a live quote. */
export type DataSource = 'live' | 'seed';

/** A platform-agnostic product identity. One canonical product may be listed by
 *  several platforms under different titles, pack formats and naming styles. */
export type CanonicalProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  /** Human readable pack descriptor, e.g. "500 ml". */
  packSize: string;
  unit: string;
  imageUrl: string;
  keywords: string[];
};

/** One platform's listing of a canonical product at a price in a dark store. */
export type Offer = {
  platform: PlatformId;
  /** The platform's own product id, for deep-linking and reconciliation. */
  platformProductId: string;
  /** The title exactly as the platform shows it (not normalised). */
  title: string;
  imageUrl: string;
  /** Pack size as listed by that platform, e.g. "0.5 L". */
  listedPackSize: string;
  /** Listed price (the "was" price), in paise. */
  mrpPaise: number;
  /** The price the user actually pays, in paise. */
  pricePaise: number;
  inStock: boolean;
  /** Estimated delivery time in minutes, dark store to door. */
  etaMinutes: number;
  /** Id of the dark store fulfilling this offer. */
  darkStoreId: string;
  /** Promotional strings, e.g. "₹75 off above ₹499". */
  promoLabels: string[];
  /** ISO timestamp at which this price was observed. */
  observedAt: string;
  /** 0..1 — confidence that the listing is genuinely the same product. */
  matchConfidence: number;
  source: DataSource;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type PincodeLocation = PincodeLocationResolved | PincodeLocationUnresolved;

export type PincodeLocationResolved = {
  resolved: true;
  pincode: string;
  /** 3-digit India Post prefix zone ("400" for Mumbai). */
  zone: string;
  city: string;
  state: string;
  locality: string;
  location: GeoPoint;
  /** How precisely we know the pincode's coordinates. */
  precision: 'exact' | 'zone-centroid';
};

export type PincodeLocationUnresolved = {
  resolved: false;
  pincode: string;
  zone: string;
  reason: string;
};

export type DarkStore = {
  id: string;
  platform: PlatformId;
  name: string;
  locality: string;
  city: string;
  pincode: string;
  location: GeoPoint;
  /** Base delivery time from this store, in minutes, before load. */
  baseEtaMinutes: number;
  /** Furthest radius this store will deliver to, in km. */
  serviceRadiusKm: number;
};

export type Serviceability = {
  platform: PlatformId;
  pincode: string;
  serviceable: boolean;
  darkStore: DarkStore | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  /** Human readable reason when serviceable is false. */
  reason?: string;
};

/** Price band a platform charges, shown so the user can understand why a
 *  cheaper headline price may not be the cheaper basket. */
export type PlatformMeta = {
  id: PlatformId;
  name: string;
  shortName: string;
  /** Brand colour used for the card accent. */
  accent: string;
  /** Approximate min order / free delivery threshold, in paise. */
  freeDeliveryAbovePaise: number;
  deliveryFeePaise: number;
  deepLinkBase: string;
};
