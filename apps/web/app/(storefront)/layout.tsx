import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { SupportWidget } from '@/components/support/SupportWidget';
import { GrainOverlay } from '@/components/fx/GrainOverlay';
import { CursorFollower } from '@/components/fx/CursorFollower';
import { SmoothScroll } from '@/components/fx/SmoothScroll';
import { PageLoader } from '@/components/fx/PageLoader';
import { ScrollProgressBar } from '@/components/fx/ScrollProgressBar';
import { PWAInstaller } from '@/components/fx/PWAInstaller';
import { InteractiveBackground } from '@/components/fx/InteractiveBackground';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <InteractiveBackground />
      <SmoothScroll />
      <PageLoader />
      <ScrollProgressBar />
      <Header />
      <main className="relative z-10 flex-1">
        <div className="page-transition">{children}</div>
      </main>
      <Footer />
      <CartDrawer />
      <SupportWidget />
      <PWAInstaller />
      <GrainOverlay />
      <CursorFollower />
    </div>
  );
}
