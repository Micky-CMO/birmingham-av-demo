import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { category: true, builder: true, inventory: true },
  });

  return (
    <div>
      <h1 className="text-h2 font-display">Products</h1>
      <p className="mt-1 text-small text-ink-500">Bulk sync or edit. Initial catalog comes from <code className="font-mono text-brand-green">pnpm ingest:ebay</code>.</p>

      <GlassCard className="mt-6 overflow-x-auto">
        <table className="w-full text-small">
          <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Builder</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productId} className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="font-mono text-caption text-ink-500">{p.sku}</div>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{p.builder.displayName}</td>
                <td className="px-4 py-3 text-right font-mono">{formatGbp(Number(p.priceGbp))}</td>
                <td className="px-4 py-3 text-right font-mono">{p.inventory?.stockQty ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  {p.isActive ? <Badge tone="positive">active</Badge> : <Badge tone="neutral">inactive</Badge>}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-ink-500">No products. Run ingestion.</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
