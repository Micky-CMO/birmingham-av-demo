import { cookies } from 'next/headers';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/storefront/ThemeToggle';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import { prisma } from '@/lib/db';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/builder-portal', label: 'Builder portal' },
  { href: '/admin/builders', label: 'Builders' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/returns', label: 'Returns' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/settings', label: 'Settings' },
];

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = cookies();
  const session = store.get('bav_session')?.value;
  let email = 'Hamza2026';
  let role = 'super_admin';
  if (session?.startsWith('user:')) {
    const userId = session.slice(5);
    const u = await prisma.user.findUnique({ where: { userId } }).catch(() => null);
    if (u) {
      email = u.email;
      role = u.role;
    }
  }

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-obsidian-950">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ink-300/60 bg-white p-4 dark:border-obsidian-500/60 dark:bg-obsidian-900 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-small font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-obsidian-800 dark:hover:text-ink-50"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6 border-t border-ink-300/50 dark:border-obsidian-500/40">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-small font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-obsidian-800 dark:hover:text-ink-50"
          >
            ← View store
          </Link>
          <div className="flex items-center justify-between px-3 text-caption text-ink-500">
            <span className="font-mono uppercase tracking-[0.2em]">v0.1.0</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
              Live
            </span>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-300/60 bg-white/70 px-6 backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/70 lg:ml-60">
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">Admin console</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AdminUserMenu email={email} role={role} />
        </div>
      </header>

      <main className="px-6 py-6 lg:ml-60">{children}</main>
    </div>
  );
}
