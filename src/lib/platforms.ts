import type { PlatformId, PlatformMeta } from '@/lib/types';

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  blinkit: {
    id: 'blinkit',
    name: 'Blinkit',
    shortName: 'Blinkit',
    accent: '#f7a600',
    freeDeliveryAbovePaise: 34900,
    deliveryFeePaise: 2500,
    deepLinkBase: 'blinkit://',
  },
  zepto: {
    id: 'zepto',
    name: 'Zepto',
    shortName: 'Zepto',
    accent: '#5b21b6',
    freeDeliveryAbovePaise: 49900,
    deliveryFeePaise: 2900,
    deepLinkBase: 'zepto://',
  },
  instamart: {
    id: 'instamart',
    name: 'Swiggy Instamart',
    shortName: 'Instamart',
    accent: '#fc8019',
    freeDeliveryAbovePaise: 39900,
    deliveryFeePaise: 3500,
    deepLinkBase: 'swiggy://',
  },
  amazon_fresh: {
    id: 'amazon_fresh',
    name: 'Amazon Fresh',
    shortName: 'Amazon Fresh',
    accent: '#ff9900',
    freeDeliveryAbovePaise: 49900,
    deliveryFeePaise: 3900,
    deepLinkBase: 'amzn://',
  },
  flipkart_minutes: {
    id: 'flipkart_minutes',
    name: 'Flipkart Minutes',
    shortName: 'Flipkart Minutes',
    accent: '#2874f0',
    freeDeliveryAbovePaise: 49900,
    deliveryFeePaise: 3500,
    deepLinkBase: 'flipkart://',
  },
};

export const PLATFORM_ORDER: PlatformId[] = [
  'blinkit',
  'zepto',
  'instamart',
  'amazon_fresh',
  'flipkart_minutes',
];

export function getPlatform(id: PlatformId): PlatformMeta {
  return PLATFORMS[id];
}

/**
 * Opening a platform app to buy is the single most important conversion in this
 * product — a price comparison that does not let you act on the answer is a
 * search engine. Every card links straight into the platform app.
 *
 * The URL uses a plausible search route. When a live catalogue is wired in, the
 * platform's own product id is substituted in by the remote adapter.
 */
export function buildDeepLink(platform: PlatformId, query: string): string {
  const meta = getPlatform(platform);
  const search = encodeURIComponent(query.trim());
  return `${meta.deepLinkBase}search?query=${search}`;
}

/** Marketplace web fallback, used when the app is not installed. */
export function buildWebUrl(platform: PlatformId, query: string): string {
  const search = encodeURIComponent(query.trim());
  switch (platform) {
    case 'blinkit':
      return `https://blinkit.com/s/?q=${search}`;
    case 'zepto':
      return `https://www.zepto.com/search/?q=${search}`;
    case 'instamart':
      return `https://www.swiggy.com/instamart/search/${search}`;
    case 'amazon_fresh':
      return `https://www.amazon.in/s?k=${search}`;
    case 'flipkart_minutes':
      return `https://www.flipkart.com/search?q=${search}`;
  }
}
