import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/storefront/ThemeToggle';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/builders', label: 'Builders' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/returns', label: 'Returns' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/products', label: 'Products' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-obsidian-950">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-ink-300/60 bg-white p-4 dark:border-obsidian-500/60 dark:bg-obsidian-900 lg:block">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-obsidian-800 dark:hover:text-ink-50"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-300/60 bg-white/70 px-6 backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/70 lg:ml-60">
        <span className="font-mono text-caption text-ink-500">Admin console</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="font-mono text-caption text-ink-500">owner@birmingham-av.com</span>
        </div>
      </header>

      <main className="px-6 py-6 lg:ml-60">{children}</main>
    </div>
  );
}
