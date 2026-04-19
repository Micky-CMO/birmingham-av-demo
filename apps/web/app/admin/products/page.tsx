import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products · Admin' };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { category: true, builder: true, inventory: true },
  });

  return (
    <main className="mx-auto max-w-page px-6 py-16 md:px-12">
      <header className="mb-12 flex items-end justify-between border-b border-ink-10 pb-8">
        <div>
          <div className="bav-label mb-4 text-ink-60">— Admin · Products</div>
          <h1 className="m-0 font-display text-[48px] font-light leading-[1] tracking-[-0.025em]">
            {products.length} <span className="bav-italic">products</span>.
          </h1>
          <p className="mt-4 max-w-[560px] text-[14px] leading-[1.55] text-ink-60">
            Add, edit, or sync catalogue items. Existing stock ingested from the
            eBay store via <code className="font-mono text-ink">pnpm ingest:ebay</code>.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/import"
            className="bav-label border border-ink-10 px-5 py-3 text-ink no-underline transition-colors hover:border-ink"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="bav-label bg-ink px-5 py-3 text-paper no-underline transition-opacity hover:opacity-90"
          >
            + Add product
          </Link>
        </div>
      </header>

      <section>
        <div className="border-y border-ink-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink-10">
                <th className="bav-label py-4 text-left text-ink-60">Product</th>
                <th className="bav-label py-4 text-left text-ink-60">Category</th>
                <th className="bav-label py-4 text-left text-ink-60">Builder</th>
                <th className="bav-label py-4 text-right text-ink-60">Price</th>
                <th className="bav-label py-4 text-right text-ink-60">Stock</th>
                <th className="bav-label py-4 text-right text-ink-60">Status</th>
                <th className="bav-label py-4 pr-4 text-right text-ink-60">Edit</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-b border-ink-10 last:border-0">
                  <td className="py-4 pr-4">
                    <div className="font-display text-[15px] leading-[1.3]">
                      {p.title}
                    </div>
                    <div className="bav-label mt-1 font-mono text-ink-30">{p.sku}</div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-ink-60">
                    {p.category?.name ?? '—'}
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-ink-60">
                    {p.builder?.displayName ?? '—'}
                  </td>
                  <td className="py-4 pr-4 text-right font-mono text-[14px]">
                    {formatGbp(Number(p.priceGbp))}
                  </td>
                  <td className="py-4 pr-4 text-right font-mono text-[14px]">
                    {p.inventory?.stockQty ?? 0}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span
                      className="bav-label inline-flex items-center gap-2"
                      style={{ color: p.isActive ? 'var(--accent)' : 'var(--ink-30)' }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background: p.isActive ? 'var(--accent)' : 'var(--ink-30)',
                        }}
                      />
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <Link
                      href={`/admin/products/${p.productId}`}
                      className="bav-label bav-hover-opa text-ink no-underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[14px] text-ink-60">
                    No products yet. Add one above or run{' '}
                    <code className="font-mono text-ink">pnpm ingest:ebay</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
