import { getPlatform } from '@/lib/platforms';
import type { PlatformId } from '@/lib/types';

/**
 * Platform mark. Real brand logos are trademarked assets and are not bundled;
 * this is a typographic monogram in the platform's own colour, which is enough
 * to scan a list of five cards at a glance.
 */
export function PlatformBadge({
  platform,
  size = 'md',
}: {
  platform: PlatformId;
  size?: 'sm' | 'md';
}) {
  const meta = getPlatform(platform);
  const initial = meta.name.replace(/^(Amazon|Flipkart|Swiggy)\s+/i, '').charAt(0).toUpperCase();

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-lg font-bold text-white ${
          size === 'sm' ? 'h-6 w-6 text-[11px]' : 'h-8 w-8 text-sm'
        }`}
        style={{ backgroundColor: meta.accent }}
      >
        {initial}
      </span>
      <span className={`font-semibold text-ink-900 ${size === 'sm' ? 'text-sm' : 'text-[15px]'}`}>
        {meta.name}
      </span>
    </span>
  );
}
