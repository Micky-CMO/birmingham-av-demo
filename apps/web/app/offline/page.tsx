import type { Metadata } from 'next';
import Link from 'next/link';
import { OfflineReload } from './OfflineReload';

export const metadata: Metadata = {
  title: 'Offline — Birmingham AV',
  description: 'You are offline. Your cart is saved locally and will sync once the connection returns.',
  robots: { index: false, follow: false },
};

// Served by the service worker as the navigation fallback when the network
// is unreachable. Keep this page static and self-contained — no Prisma, no
// dynamic imports, no third-party scripts.
export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <main className="flex flex-1 items-center py-24">
        <div className="bav-fade mx-auto w-full max-w-[960px] px-6 md:px-12">
          <div className="mb-16 text-center">
            <div className="bav-label mb-8 text-ink-60">— Offline</div>
            <h1 className="m-0 font-display font-light tracking-[-0.02em] text-[clamp(56px,8vw,96px)] leading-[0.98]">
              The shop
              <br /> is <span className="bav-italic">off the grid</span>.
            </h1>
            <p className="mx-auto mt-8 max-w-[480px] text-[14px] leading-[1.7] text-ink-60">
              The catalogue needs a connection — your cart is still saved locally.
              Reconnect and we&apos;ll pick up where you left off.
            </p>
          </div>

          <div className="flex flex-col items-center gap-5">
            <OfflineReload />
            <Link href="/" className="bav-underline text-[13px] text-ink no-underline">
              <span>Back to the shop</span> <span className="arrow">→</span>
            </Link>
            <Link href="/cart" className="bav-underline text-[13px] text-ink no-underline">
              <span>Open cart (offline)</span> <span className="arrow">→</span>
            </Link>
          </div>

          <p className="mx-auto mt-20 max-w-[600px] text-center text-[13px] leading-[1.6] text-ink-30">
            The workshop is in Birmingham. When you are back on the network we will sync
            anything you added to your cart.
          </p>
        </div>
      </main>
    </div>
  );
}
