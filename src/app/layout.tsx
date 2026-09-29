import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { PincodeProvider } from '@/components/PincodeProvider';

export const metadata: Metadata = {
  title: {
    default: 'KitneKa — compare prices across Blinkit, Zepto, Instamart & more',
    template: '%s · KitneKa',
  },
  description:
    'Search a product and see the same product on every Indian quick-commerce platform, sorted cheapest first, with delivery times for your pincode.',
};

export const viewport: Viewport = {
  themeColor: '#f6f7f9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen">
        <PincodeProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="mt-16 border-t border-ink-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-500">
              <p className="font-medium text-ink-700">KitneKa</p>
              <p className="mt-1 max-w-2xl leading-relaxed">
                Price comparison for Indian quick commerce. Prices, availability and delivery
                times change constantly and differ by locality — always confirm the final price on
                the platform before you order.
              </p>
            </div>
          </footer>
        </PincodeProvider>
      </body>
    </html>
  );
}
