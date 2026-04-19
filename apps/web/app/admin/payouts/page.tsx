import { prisma } from '@/lib/db';
import { PayoutsManager, type PayoutRow } from '@/components/admin/PayoutsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Builder payouts · Admin' };

export default async function AdminPayoutsPage() {
  const payouts = await prisma.builderPayout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const builderIds = Array.from(new Set(payouts.map((p) => p.builderId)));
  const builders = builderIds.length
    ? await prisma.builder.findMany({
        where: { builderId: { in: builderIds } },
        select: {
          builderId: true,
          builderCode: true,
          displayName: true,
          tier: true,
        },
      })
    : [];
  const builderMap = new Map(builders.map((b) => [b.builderId, b]));

  const rows: PayoutRow[] = payouts.map((p) => {
    const b = builderMap.get(p.builderId);
    return {
      payoutId: p.payoutId,
      builderId: p.builderId,
      builderCode: b?.builderCode ?? '—',
      builderName: b?.displayName ?? '—',
      tier: b?.tier ?? 'standard',
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
      totalBuildsCompleted: p.totalBuildsCompleted,
      totalRevenueGbp: Number(p.totalRevenueGbp),
      commissionRateBp: p.commissionRateBp,
      commissionGbp: Number(p.commissionGbp),
      status: p.status,
      paidAt: p.paidAt?.toISOString() ?? null,
      stripeTransferId: p.stripeTransferId,
    };
  });

  const kpis = {
    builders: new Set(payouts.map((p) => p.builderId)).size,
    totalBuilds: payouts.reduce((sum, p) => sum + p.totalBuildsCompleted, 0),
    totalRevenue: payouts.reduce((sum, p) => sum + Number(p.totalRevenueGbp), 0),
    totalCommission: payouts.reduce((sum, p) => sum + Number(p.commissionGbp), 0),
  };

  return <PayoutsManager rows={rows} kpis={kpis} />;
}
