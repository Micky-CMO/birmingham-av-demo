import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function AdminReturnsPage() {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { product: true, builder: true, requestedByUser: { select: { email: true } } },
  });
  return (
    <div>
      <h1 className="text-h2 font-display">Returns</h1>
      <GlassCard className="mt-6 overflow-x-auto">
        <table className="w-full text-small">
          <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
            <tr>
              <th className="px-4 py-3 text-left">Return</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Builder</th>
              <th className="px-4 py-3 text-right">Refund</th>
              <th className="px-4 py-3 text-right">AI severity</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.returnId} className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/30">
                <td className="px-4 py-3 font-mono">{r.returnNumber}</td>
                <td className="px-4 py-3">{r.reason}</td>
                <td className="px-4 py-3">{r.product.title}</td>
                <td className="px-4 py-3">{r.builder.displayName}</td>
                <td className="px-4 py-3 text-right font-mono">{formatGbp(Number(r.refundAmountGbp))}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {r.aiSeverity === null ? '-' : (Number(r.aiSeverity)).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right"><Badge tone={r.status === 'resolved' ? 'positive' : 'info'}>{r.status}</Badge></td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-ink-500">No returns yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
