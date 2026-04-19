import { Nav } from '@/components/shell/Nav';
import { Footer } from '@/components/shell/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { activeBuildCount } from '@/lib/services/ops';

export const dynamic = 'force-dynamic';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const activeBuilds = await activeBuildCount();
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Nav activeBuilds={activeBuilds} />
      <main className="flex-1">{children}</main>
      <Footer activeBuilds={activeBuilds} version="v0.1.0" />
      <CartDrawer />
    </div>
  );
}
