import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-50 dark:bg-obsidian-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 500px at 50% -20%, rgba(30,181,58,0.18), transparent 60%)',
        }}
      />
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        <Logo />
      </header>
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center md:py-32">
        <div className="font-mono text-caption uppercase tracking-[0.4em] text-ink-500">404</div>
        <h1 className="mt-6 font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
          Not in stock.
        </h1>
        <p className="mt-6 max-w-lg text-body leading-relaxed text-ink-700 dark:text-ink-300">
          The page you were looking for has moved or never existed. Let us point you back to the catalogue.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/"><Button size="lg">Home</Button></Link>
          <Link href="/shop"><Button size="lg" variant="outline">Shop</Button></Link>
          <Link href="/help"><Button size="lg" variant="ghost">Help centre</Button></Link>
        </div>
      </main>
    </div>
  );
}
