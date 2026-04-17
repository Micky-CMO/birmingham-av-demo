import { prisma } from '@/lib/db';
import type { BuilderRow, BuilderSummary } from '@bav/lib';

export async function getSpotlightBuilder() {
  const count = await prisma.builder.count({ where: { status: 'active', tier: { in: ['preferred', 'elite'] } } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const [builder] = await prisma.builder.findMany({
    where: { status: 'active', tier: { in: ['preferred', 'elite'] } },
    orderBy: { qualityScore: 'desc' },
    skip,
    take: 1,
  });
  if (!builder) return null;
  return {
    builderCode: builder.builderCode,
    displayName: builder.displayName,
    avatarUrl: builder.avatarUrl,
    tier: builder.tier as 'probation' | 'standard' | 'preferred' | 'elite',
    totalUnitsBuilt: builder.totalUnitsBuilt,
    qualityScore: Number(builder.qualityScore),
    bio: builder.bio,
  };
}

export async function getBuilderSummary(): Promise<BuilderSummary> {
  const builders = await prisma.builder.findMany({
    where: { status: { in: ['active', 'review'] } },
    orderBy: { rmaRateRolling90d: 'desc' },
    include: { warehouseNode: true },
  });

  const items: BuilderRow[] = builders.map((b) => {
    const unitsBuilt90d = Math.round(b.totalUnitsBuilt * 0.25);
    const unitsSold90d = Math.round(b.totalUnitsSold * 0.25);
    const rmaCount90d = Math.round(Number(b.rmaRateRolling90d) * unitsSold90d);
    const avgPrice = 850;
    const avgMargin = avgPrice * 0.28;
    return {
      builderId: b.builderId,
      builderCode: b.builderCode,
      displayName: b.displayName,
      avatarUrl: b.avatarUrl,
      tier: b.tier as 'probation' | 'standard' | 'preferred' | 'elite',
      warehouseNodeCode: b.warehouseNode.nodeCode,
      unitsBuilt90d,
      unitsSold90d,
      revenueGbp90d: Math.round(unitsSold90d * avgPrice),
      marginGbp90d: Math.round(unitsSold90d * avgMargin),
      roiPct90d: Number(((avgMargin / avgPrice) * 100).toFixed(1)),
      rmaRate90d: Number(b.rmaRateRolling90d),
      rmaCount90d,
      qualityScore: Number(b.qualityScore),
      avgBuildMinutes: b.avgBuildMinutes,
      avgResponseHours: Number(b.avgResponseHours),
      trend14d: trend14dFor(b.builderCode, unitsSold90d),
      flagged: b.flaggedByAi,
      flagReason: b.lastFlagReason,
      updatedAt: b.updatedAt.toISOString(),
    };
  });

  const totalUnitsSold = items.reduce((a, b) => a + b.unitsSold90d, 0);
  const totalRevenueGbp = items.reduce((a, b) => a + b.revenueGbp90d, 0);
  const totalMarginGbp = items.reduce((a, b) => a + b.marginGbp90d, 0);
  const totalRmas = items.reduce((a, b) => a + b.rmaCount90d, 0);

  return {
    items,
    totals: {
      totalBuilders: items.length,
      totalUnitsSold,
      totalRevenueGbp,
      totalMarginGbp,
      overallRmaRate: totalUnitsSold > 0 ? Number((totalRmas / totalUnitsSold).toFixed(4)) : 0,
      flaggedCount: items.filter((i) => i.flagged).length,
    },
  };
}

function trend14dFor(seed: string, base: number): number[] {
  const out: number[] = [];
  let s = 0;
  for (let i = 0; i < seed.length; i += 1) s = (s * 31 + seed.charCodeAt(i)) % 1_000_000;
  for (let day = 0; day < 14; day += 1) {
    s = (s * 9301 + 49297) % 233280;
    const noise = (s / 233280 - 0.5) * 0.4;
    out.push(Math.max(0, Math.round((base / 14) * (1 + noise))));
  }
  return out;
}
