import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

const columns: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/builders', label: 'Our builders' },
      { href: '/warehouses', label: 'Warehouses' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { href: '/shop/gaming-pc-bundles', label: 'Gaming PCs' },
      { href: '/shop/laptops', label: 'Laptops' },
      { href: '/shop/monitors', label: 'Monitors' },
      { href: '/shop/parts', label: 'Parts' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/help', label: 'Help centre' },
      { href: '/returns/new', label: 'Start a return' },
      { href: '/warranty', label: 'Warranty' },
      { href: '/shipping', label: 'Shipping' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/modern-slavery', label: 'Modern slavery statement' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-300/60 bg-ink-50 dark:border-obsidian-500/60 dark:bg-obsidian-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-small text-ink-500 dark:text-ink-300">
              Tested, warrantied, and shipped from Birmingham. Made with care by people who know PCs.
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="text-caption text-ink-500">{c.title}</h3>
              <ul className="mt-4 space-y-1">
                {c.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="flex min-h-11 items-center text-small text-ink-700 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-ink-50"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-ink-300/60 pt-8 text-small text-ink-500 sm:mt-12 sm:flex-row sm:items-center dark:border-obsidian-500/60">
          <span>&copy; {new Date().getFullYear()} Birmingham AV Ltd. Registered in England, no. 12383651.</span>
          <div className="flex items-center gap-6 font-mono text-caption">
            <Link
              href="/auth/login"
              className="inline-flex min-h-11 items-center uppercase tracking-[0.2em] text-ink-500 transition-colors hover:text-brand-green"
            >
              Staff sign in
            </Link>
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
