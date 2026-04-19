import Link from 'next/link';
import { PaymentMethods, DeliveryPartners } from './PaymentMethods';

type FooterProps = {
  activeBuilds?: number;
  version?: string;
};

/**
 * Apple-style footer sitemap: 6 columns grouped by theme + brand block.
 * Accessibility + Careers live under "Our Values" and "About" respectively,
 * matching apple.com structure.
 */
const COLS: Array<{ title: string; items: Array<{ label: string; href: string }> }> = [
  {
    title: 'Shop and Learn',
    items: [
      { label: 'Computers', href: '/shop/computers' },
      { label: 'Laptops', href: '/shop/laptops' },
      { label: 'Monitors', href: '/shop/monitors' },
      { label: 'Networking', href: '/shop/network-equipment' },
      { label: 'Storage', href: '/shop/hard-drive' },
      { label: 'Accessories', href: '/shop/parts' },
      { label: 'Gift cards', href: '/gift-cards' },
      { label: 'Build a PC', href: '/configurator' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Your account', href: '/account' },
      { label: 'Orders', href: '/account/orders' },
      { label: 'AV Care', href: '/account/av-care' },
      { label: 'Wishlist', href: '/account/wishlist' },
      { label: 'Compare', href: '/compare' },
      { label: 'Sign in', href: '/auth/login' },
    ],
  },
  {
    title: 'Visit',
    items: [
      { label: 'Digbeth workshop', href: '/warehouses' },
      { label: 'Meet the builders', href: '/builders' },
      { label: 'Workshop tours', href: '/warehouses#tours' },
      { label: 'Find a PC', href: '/shop' },
      { label: 'Trade-in', href: '/trade-in' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'For Business',
    items: [
      { label: 'Trade accounts', href: '/business' },
      { label: 'Request a quote', href: '/business/quote' },
      { label: 'Volume pricing', href: '/business/quote' },
      { label: 'Refurbished fleets', href: '/business#fleets' },
      { label: 'Finance', href: '/finance' },
    ],
  },
  {
    title: 'Our Values',
    items: [
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Environment', href: '/about#environment' },
      { label: 'Refurbishment ethics', href: '/journal/what-refurbished-actually-means' },
      { label: 'Inclusion', href: '/about#inclusion' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Modern slavery', href: '/modern-slavery' },
    ],
  },
  {
    title: 'About',
    items: [
      { label: 'About Birmingham AV', href: '/about' },
      { label: 'Journal', href: '/journal' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/about#press' },
      { label: 'Ethics', href: '/modern-slavery' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

const LEGAL = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Modern slavery', href: '/modern-slavery' },
  { label: 'Accessibility', href: '/accessibility' },
];

export function Footer({ activeBuilds = 0, version = 'v0.1.0' }: FooterProps) {
  return (
    <footer className="border-t border-ink-10 bg-paper" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Site footer</h2>

      {/* Brand strip */}
      <div className="mx-auto max-w-page px-6 pt-20 md:px-12 md:pt-24">
        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-5 font-display text-[44px] font-light leading-[1] tracking-[-0.025em]">
              Birmingham<span className="bav-italic">AV</span>
            </div>
            <p className="m-0 mb-6 max-w-[420px] text-[15px] leading-[1.6] text-ink-60">
              Computers built by people who care how they go together. New and refurbished,
              warrantied worldwide, shipped from the United Kingdom.
            </p>
            {activeBuilds > 0 && (
              <div className="bav-label flex items-center gap-3 text-ink-60">
                <span className="bav-pulse" />
                <span>Workshop active — {activeBuilds} builds in progress</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-6 md:items-end md:text-right">
            <div>
              <div className="bav-label mb-3 text-ink-60">— Workshop</div>
              <address className="not-italic text-[14px] leading-[1.6] text-ink">
                Fazeley Street<br />Digbeth, Birmingham B5 5RS<br />United Kingdom
              </address>
            </div>
            <div>
              <div className="bav-label mb-3 text-ink-60">— Support</div>
              <a href="mailto:support@birmingham-av.com" className="text-[14px] text-ink no-underline">
                support@birmingham-av.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sitemap — 6 columns on lg, 3 on md, 2 on sm, 1 on xs */}
      <nav aria-label="Footer sitemap" className="border-t border-ink-10">
        <div className="mx-auto max-w-page px-6 py-16 md:px-12 md:py-20">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
            {COLS.map((col) => (
              <div key={col.title}>
                <div className="bav-label mb-5 text-ink font-semibold">{col.title}</div>
                <ul className="m-0 list-none space-y-3 p-0">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="bav-hover-opa text-[13px] text-ink-60 no-underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Payment + delivery strip */}
      <div className="border-t border-ink-10">
        <div className="mx-auto max-w-page px-6 py-10 md:px-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="flex flex-col gap-3">
              <span className="bav-label text-ink-60">— We accept</span>
              <PaymentMethods />
            </div>
            <div className="flex flex-col gap-3">
              <span className="bav-label text-ink-60">— Delivery partners</span>
              <DeliveryPartners />
            </div>
          </div>
        </div>
      </div>

      {/* Legal + company info */}
      <div className="border-t border-ink-10">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-12">
          <div className="bav-label text-ink-60">
            © 2026 Birmingham AV Ltd · Reg. No. 12383651
          </div>
          <div className="flex flex-wrap gap-5">
            {LEGAL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bav-hover-opa bav-label text-ink-60 no-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="bav-label text-ink-30">Built by Mickai™ · {version}</div>
        </div>
      </div>
    </footer>
  );
}
