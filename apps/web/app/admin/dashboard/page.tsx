import { GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [ordersToday, openTickets, flaggedReturns, activeBuilds] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) }, status: { not: 'draft' } },
    }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'ai_handling', 'awaiting_customer'] } } }),
    prisma.return.count({ where: { aiFlaggedPattern: { not: null }, status: { not: 'resolved' } } }),
    prisma.buildQueue.count({ where: { status: { in: ['queued', 'in_progress'] } } }),
  ]);

  const weekRevenueAgg = await prisma.order.aggregate({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) }, status: { not: 'draft' } },
    _sum: { totalGbp: true },
  });

  const kpis: Array<{ label: string; value: string; tone?: 'positive' | 'warning' | 'critical' }> = [
    { label: 'Revenue 7d', value: formatGbp(Number(weekRevenueAgg._sum.totalGbp ?? 0)), tone: 'positive' },
    { label: 'Orders today', value: String(ordersToday) },
    { label: 'Open tickets', value: String(openTickets), tone: openTickets > 20 ? 'warning' : undefined },
    { label: 'Flagged returns', value: String(flaggedReturns), tone: flaggedReturns > 0 ? 'critical' : undefined },
    { label: 'Active builds', value: String(activeBuilds) },
  ];

  return (
    <div>
      <h1 className="text-h2 font-display">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="p-5">
            <div className="text-caption text-ink-500">{k.label}</div>
            <div
              className={`mt-2 font-display text-data-lg ${
                k.tone === 'positive'
                  ? 'text-brand-green'
                  : k.tone === 'warning'
                    ? 'text-semantic-warning'
                    : k.tone === 'critical'
                      ? 'text-semantic-critical'
                      : ''
              }`}
            >
              {k.value}
            </div>
          </GlassCard>
        ))}
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="text-h3 font-display">Activity</h2>
          <p className="mt-2 text-small text-ink-500">EventBridge tap. Wire via /api/admin/activity.</p>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-h3 font-display">Live build queue</h2>
          <p className="mt-2 text-small text-ink-500">Builders currently active across warehouse nodes.</p>
        </GlassCard>
      </section>
    </div>
  );
}
