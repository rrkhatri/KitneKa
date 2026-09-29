import type { PlatformId } from '@/lib/types';

/**
 * Platform logos.
 *
 * Hand-built inline SVG recreations of each platform's real brand mark, so the
 * app ships no third-party image requests and works offline. They are rendered
 * as components rather than <img> so they inherit colour and need no network
 * round-trip.
 *
 * The two App-flavoured brands are represented by their monogram tile, which is
 * how each is actually presented in its own UI.
 */

type LogoProps = { size?: number; className?: string };

export function PlatformLogo({ platform, size = 24, className }: LogoProps & { platform: PlatformId }) {
  switch (platform) {
    case 'blinkit':
      return <BlinkitLogo size={size} className={className} />;
    case 'zepto':
      return <ZeptoLogo size={size} className={className} />;
    case 'instamart':
      return <InstamartLogo size={size} className={className} />;
    case 'amazon_fresh':
      return <AmazonFreshLogo size={size} className={className} />;
    case 'flipkart_minutes':
      return <FlipkartMinutesLogo size={size} className={className} />;
  }
}

/** Blinkit: the yellow lightning bolt on a dark rounded tile. */
function BlinkitLogo({ size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="Blinkit">
      <rect width="40" height="40" rx="10" fill="#FFE500" />
      <path
        d="M23.4 4.5 10 22.1c-.5.7 0 1.7.9 1.7h6.9l-1.6 11.7c-.1.9 1.1 1.3 1.7.6L31.4 18c.5-.7 0-1.7-.9-1.7h-6.8l1.5-11c.2-.9-1.1-1.3-1.8-.8Z"
        fill="#101010"
      />
    </svg>
  );
}

/** Zepto: the purple lightning bolt wordmark. */
function ZeptoLogo({ size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="Zepto">
      <rect width="40" height="40" rx="10" fill="#5C2E9E" />
      <path
        d="M24.6 7.5 13 21.3a1 1 0 0 0 .75 1.66h5.2l-1.3 9.3a.5.5 0 0 0 .9.36l11.1-12.6a1 1 0 0 0-.76-1.65h-5.3l1.2-8.9a.5.5 0 0 0-.9-.34Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/** Swiggy Instamart: the orange bag mark. */
function InstamartLogo({ size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="Swiggy Instamart">
      <rect width="40" height="40" rx="10" fill="#FC8019" />
      <path
        d="M13 12.5h14l-1.1 16.2a2.6 2.6 0 0 1-2.6 2.4h-6.6a2.6 2.6 0 0 1-2.6-2.4L13 12.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M16.6 14.6V11a3.4 3.4 0 0 1 6.8 0v3.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M17.6 20.2 20 22.6l4.6-4.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Amazon Fresh: the Amazon smile arrow. */
function AmazonFreshLogo({ size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="Amazon Fresh">
      <rect width="40" height="40" rx="10" fill="#232F3E" />
      <text
        x="20"
        y="19"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="11"
        fontWeight="700"
        fill="#FF9900"
        letterSpacing="0.3"
      >
        a
      </text>
      <path
        d="M11.5 22.5c4 3.2 9.4 4.6 13.6 3.6 2.6-.6 4.8-1.9 6.4-3.7"
        fill="none"
        stroke="#FF9900"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M29.4 19.6 31.6 22l.5-3" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Flipkart Minutes: the blue flip-k mark. */
function FlipkartMinutesLogo({ size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="Flipkart Minutes">
      <rect width="40" height="40" rx="10" fill="#2874F0" />
      <path
        d="M12 10h5.6l3 8.6L23.6 10H29l-6 12.4 6.1 12.6h-5.5l-3.1-8.7-3.2 8.7H12l6.1-12.6L12 10Z"
        fill="#fff"
      />
    </svg>
  );
}
