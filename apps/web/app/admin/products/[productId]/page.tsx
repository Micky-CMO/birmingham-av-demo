import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { productId: string } }) {
  const product = await prisma.product.findUnique({
    where: { productId: params.productId },
    select: { title: true },
  });
  return { title: product ? `${product.title} · Admin` : 'Product · Admin' };
}

export default async function AdminProductDetailPage({
  params,
}: {
  params: { productId: string };
}) {
  const product = await prisma.product.findUnique({
    where: { productId: params.productId },
    include: {
      category: true,
      builder: true,
      inventory: true,
    },
  });
  if (!product) notFound();

  const recentOrders = await prisma.orderItem.count({
    where: { productId: product.productId },
  });

  return (
    <main className="mx-auto max-w-[960px] px-6 py-16 md:px-12">
      <header className="mb-10 border-b border-ink-10 pb-8">
        <Link href="/admin/products" className="bav-label bav-hover-opa text-ink-60 no-underline">
          ← Products
        </Link>
        <div className="bav-label mt-8 font-mono text-ink-30">№{product.sku}</div>
        <h1 className="m-0 mt-4 font-display text-[48px] font-light leading-[1.05] tracking-[-0.025em]">
          {product.title}
        </h1>
        {product.subtitle && (
          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.55] text-ink-60">
            {product.subtitle}
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="border border-ink-10 p-6">
          <div className="bav-label mb-3 text-ink-60">— Price</div>
          <div className="font-display text-[28px] font-light leading-none tracking-[-0.02em]">
            {formatGbp(Number(product.priceGbp))}
          </div>
          {product.compareAtGbp && (
            <div className="bav-label mt-2 font-mono text-ink-30 line-through">
              {formatGbp(Number(product.compareAtGbp))}
            </div>
          )}
        </div>
        <div className="border border-ink-10 p-6">
          <div className="bav-label mb-3 text-ink-60">— Stock</div>
          <div className="font-display text-[28px] font-light leading-none tracking-[-0.02em]">
            {product.inventory?.stockQty ?? 0}
          </div>
          <div className="bav-label mt-2 text-ink-60">
            Reserved: {product.inventory?.reservedQty ?? 0}
          </div>
        </div>
        <div className="border border-ink-10 p-6">
          <div className="bav-label mb-3 text-ink-60">— Lifetime orders</div>
          <div className="font-display text-[28px] font-light leading-none tracking-[-0.02em]">
            {recentOrders}
          </div>
          <div className="bav-label mt-2 text-ink-60">Order item rows</div>
        </div>
      </section>

      <section className="mt-12 border-t border-ink-10 pt-8">
        <div className="bav-label mb-8 text-ink-60">— Details</div>
        <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <dt className="bav-label mb-2 text-ink-60">Category</dt>
            <dd className="text-[14px]">{product.category?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="bav-label mb-2 text-ink-60">Builder</dt>
            <dd className="text-[14px]">
              {product.builder?.displayName} · {product.builder?.builderCode}
            </dd>
          </div>
          <div>
            <dt className="bav-label mb-2 text-ink-60">Condition</dt>
            <dd className="text-[14px] capitalize">
              {product.conditionGrade.replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="bav-label mb-2 text-ink-60">Warranty</dt>
            <dd className="text-[14px]">{product.warrantyMonths} months</dd>
          </div>
          <div>
            <dt className="bav-label mb-2 text-ink-60">Slug</dt>
            <dd className="font-mono text-[13px]">/{product.slug}</dd>
          </div>
          <div>
            <dt className="bav-label mb-2 text-ink-60">Status</dt>
            <dd className="text-[14px]">
              {product.isActive ? 'Active' : 'Inactive'}
              {product.isFeatured && ' · Featured'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12 border-t border-ink-10 pt-8">
        <div className="bav-label mb-6 text-ink-60">— Actions</div>
        <p className="m-0 mb-4 text-[14px] leading-[1.55] text-ink-60">
          Full editor coming shortly. For now, update price, stock, images, or
          spec sheet directly in the database or via the admin API.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener"
            className="bav-label border border-ink-10 px-5 py-3 text-ink no-underline transition-colors hover:border-ink"
          >
            View on storefront ↗
          </Link>
          <Link
            href="/admin/products"
            className="bav-label border border-ink-10 px-5 py-3 text-ink no-underline transition-colors hover:border-ink"
          >
            Back to list
          </Link>
        </div>
      </section>
    </main>
  );
}
