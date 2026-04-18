import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/brand/Logo';
import Link from 'next/link';

export const metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-50 dark:bg-obsidian-950">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 600px at 20% -10%, rgba(30,181,58,0.18), transparent 60%), radial-gradient(800px 500px at 110% 110%, rgba(79,145,255,0.08), transparent 60%)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <Link href="/" className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500 hover:text-ink-900 dark:hover:text-ink-50">
          ← Back to site
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Birmingham AV · Staff portal</p>
            <h1 className="mt-3 font-display text-h1 font-semibold tracking-[-0.02em]">Sign in</h1>
            <p className="mt-3 text-small text-ink-500">Staff and builder access. Customers, use the main site.</p>
          </div>

          <div className="rounded-2xl border border-ink-300/60 bg-white/80 p-8 shadow-glass-light backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/80 dark:shadow-glass-dark">
            <LoginForm next={searchParams.next ?? '/admin/dashboard'} />
          </div>

          <p className="mt-6 text-center text-caption text-ink-500">
            Demo credentials:{' '}
            <code className="rounded-sm bg-ink-100 px-1 py-0.5 font-mono dark:bg-obsidian-800">Hamza2026</code> /{' '}
            <code className="rounded-sm bg-ink-100 px-1 py-0.5 font-mono dark:bg-obsidian-800">Micky2026!</code>
          </p>
        </div>
      </main>
    </div>
  );
}
