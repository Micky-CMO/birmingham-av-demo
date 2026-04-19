import { Nav } from '@/components/shell/Nav';
import { Footer } from '@/components/shell/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SupportWidget } from '@/components/support/SupportWidget';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { activeBuildCount } from '@/lib/services/ops';

export const dynamic = 'force-dynamic';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const activeBuilds = await activeBuildCount();
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only absolute left-4 top-4 z-[200] bg-ink px-4 py-2 text-[13px] font-medium text-paper no-underline focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Nav activeBuilds={activeBuilds} />
      <main id="main" className="flex-1">{children}</main>
      <Footer activeBuilds={activeBuilds} version="v0.1.0" />
      <CartDrawer />
      <SupportWidget />
      <CookieConsent />
      <InstallBanner />
    </div>
  );
}
