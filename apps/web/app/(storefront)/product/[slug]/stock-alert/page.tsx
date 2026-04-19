import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StockAlertForm } from './StockAlertForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { title: true } }).catch(() => null);
  return {
    title: product ? `${product.title} · Stock alert` : 'Stock alert — Birmingham AV',
    description:
      'Tell us where to send you a single email when this build is back on the workshop floor. One notification, no marketing.',
  };
}

export default async function StockAlertPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      builder: { select: { displayName: true, builderCode: true } },
      inventory: { select: { stockQty: true } },
    },
  });

  if (!product) notFound();

  const stockQty = product.inventory?.stockQty ?? 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto max-w-[720px] px-10 pb-24 pt-20">
        <div className="bav-label mb-5 text-ink-60">— Stock alert · one email, no marketing</div>
        <h1 className="mb-6 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(40px,4.5vw,64px)]">
          When it's back on the <span className="bav-italic">floor</span>.
        </h1>
        <p className="mb-10 max-w-[520px] text-[16px] leading-[1.6] text-ink-60">
          Hand-built inventory runs light by design. Leave an email below and we'll send a single notification when{' '}
          <strong className="font-normal text-ink">{product.title}</strong> is ready to order again. No marketing lists, no drip.
        </p>

        <div className="mb-10 border border-ink-10 bg-paper-2 p-6">
          <div className="grid grid-cols-[1fr_auto] gap-6">
            <div>
              <div className="bav-label mb-[6px] text-ink-60">Build</div>
              <div className="font-display text-[22px] tracking-[-0.01em]">{product.title}</div>
              {product.subtitle && <div className="mt-1 font-mono text-[12px] tabular-nums text-ink-60">{product.subtitle}</div>}
              <div className="mt-3 bav-label text-ink-60">
                Built by {product.builder.displayName} · {product.builder.builderCode}
              </div>
            </div>
            <div className="text-right">
              <div className="bav-label mb-[6px] text-ink-60">Current stock</div>
              <div className="font-mono text-[20px] tabular-nums">{stockQty}</div>
            </div>
          </div>
        </div>

        <StockAlertForm productId={product.productId} productTitle={product.title} />

        <div className="mt-12">
          <Link href={`/product/${product.slug}`} className="bav-underline text-[13px] text-ink-60 no-underline">
            <span>Back to {product.title}</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
