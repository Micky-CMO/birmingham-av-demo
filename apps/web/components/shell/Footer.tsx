import Link from 'next/link';

type FooterProps = {
  activeBuilds?: number;
  version?: string;
};

const COLS: Array<{ title: string; items: Array<{ label: string; href: string }>; span: string }> = [
  {
    title: 'Shop',
    span: 'col-span-2',
    items: [
      { label: 'Gaming PC bundles', href: '/shop/gaming-pc-bundles' },
      { label: 'Computers', href: '/shop/computers' },
      { label: 'Laptops', href: '/shop/laptops' },
      { label: 'Monitors', href: '/shop/monitors' },
      { label: 'Parts', href: '/shop/parts' },
      { label: 'All categories', href: '/shop' },
    ],
  },
  {
    title: 'Company',
    span: 'col-span-2',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Builders', href: '/builders' },
      { label: 'Workshops', href: '/warehouses' },
      { label: 'Journal', href: '/journal' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Support',
    span: 'col-span-3',
    items: [
      { label: 'Help centre', href: '/help' },
      { label: 'Start a return', href: '/returns/new' },
      { label: 'Warranty', href: '/warranty' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns policy', href: '/returns-policy' },
      { label: 'Sign in', href: '/auth/login' },
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
    <footer className="border-t border-ink-10 bg-paper">
      <div className="bav-footer-inner mx-auto max-w-page px-12 pb-12 pt-24">
        <div className="bav-footer-grid mb-20 grid grid-cols-12 gap-12">
          <div className="bav-footer-brand col-span-5">
            <div className="mb-6 font-display text-[32px] tracking-[-0.02em]">Birmingham AV</div>
            <p className="mb-7 max-w-[380px] text-[14px] leading-[1.6] text-ink-60">
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
          {COLS.map((col) => (
            <div key={col.title} className={`bav-footer-col ${col.span}`}>
              <div className="bav-label mb-6 text-ink-60">{col.title}</div>
              <ul className="m-0 list-none p-0">
                {col.items.map((item) => (
                  <li key={item.href} className="mb-[14px]">
                    <Link href={item.href} className="bav-hover-opa text-[14px] text-ink no-underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid gap-5 border-t border-ink-10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="bav-label text-ink-60">
              Visa · Mastercard · Amex · PayPal · Apple Pay · Google Pay · Klarna · Clearpay
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="bav-label text-ink-60">© 2026 Birmingham AV Ltd · Reg. No. 12383651</div>
            <div className="bav-label text-ink-30">Built by Mickai™ · {version}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
