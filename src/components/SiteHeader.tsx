'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PincodeChip } from './PincodeChip';

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white"
          >
            ₹
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">KitneKa</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/stores"
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
              pathname === '/stores'
                ? 'bg-ink-100 text-ink-900'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`}
          >
            Stores
          </Link>
          <PincodeChip />
        </nav>
      </div>
    </header>
  );
}
