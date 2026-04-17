import { prisma } from '../db';

export async function builderSnapshotWorker(): Promise<void> {
  const now = new Date();
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - 90 * 86_400_000);

  const builders = await prisma.builder.findMany();
  for (const b of builders) {
    const [units, rmas, orderItems] = await Promise.all([
      prisma.unit.count({ where: { builderId: b.builderId, buildCompletedAt: { gte: periodStart } } }),
      prisma.return.count({ where: { builderId: b.builderId, createdAt: { gte: periodStart } } }),
      prisma.orderItem.findMany({
        where: { builderId: b.builderId, order: { status: { in: ['paid', 'shipped', 'delivered'] }, createdAt: { gte: periodStart } } },
        select: { pricePerUnitGbp: true, costPerUnitGbp: true, qty: true },
      }),
    ]);
    const revenue = orderItems.reduce((s, i) => s + Number(i.pricePerUnitGbp) * i.qty, 0);
    const cost = orderItems.reduce((s, i) => s + Number(i.costPerUnitGbp) * i.qty, 0);
    const margin = revenue - cost;
    const sold = orderItems.reduce((s, i) => s + i.qty, 0);
    const rmaRate = units === 0 ? 0 : rmas / units;

    await prisma.builderPerformanceSnapshot.upsert({
      where: { builderId_period_periodStart: { builderId: b.builderId, period: 'rolling_90d', periodStart } },
      update: {
        periodEnd,
        unitsBuilt: units,
        unitsSold: sold,
        revenueGbp: revenue,
        costGbp: cost,
        marginGbp: margin,
        roiPct: cost === 0 ? 0 : (margin / cost) * 100,
        rmaCount: rmas,
        rmaRate,
      },
      create: {
        builderId: b.builderId,
        period: 'rolling_90d',
        periodStart,
        periodEnd,
        unitsBuilt: units,
        unitsSold: sold,
        revenueGbp: revenue,
        costGbp: cost,
        marginGbp: margin,
        roiPct: cost === 0 ? 0 : (margin / cost) * 100,
        rmaCount: rmas,
        rmaRate,
      },
    });

    await prisma.builder.update({
      where: { builderId: b.builderId },
      data: { rmaRateRolling90d: rmaRate },
    });
  }
}
