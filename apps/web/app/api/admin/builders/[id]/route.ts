import { z } from 'zod';
import { prisma } from '@/lib/db';
import { connectMongo, BuilderQualityFlag } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const b = await prisma.builder.findUnique({
      where: { builderId: params.id },
      include: {
        warehouseNode: true,
        snapshots: { orderBy: { periodEnd: 'desc' }, take: 6 },
      },
    });
    if (!b) return bad(404, 'not found');
    await connectMongo();
    const flags = await BuilderQualityFlag.find({ postgresBuilderId: b.builderId, resolvedAt: { $exists: false } })
      .sort({ raisedAt: -1 })
      .limit(20)
      .lean();
    return ok({
      builder: {
        builderId: b.builderId,
        builderCode: b.builderCode,
        displayName: b.displayName,
        tier: b.tier,
        status: b.status,
        warehouseNodeCode: b.warehouseNode.nodeCode,
        qualityScore: Number(b.qualityScore),
        rmaRateRolling90d: Number(b.rmaRateRolling90d),
        flaggedByAi: b.flaggedByAi,
        totalUnitsBuilt: b.totalUnitsBuilt,
      },
      snapshots: b.snapshots.map((s) => ({
        period: s.period,
        periodEnd: s.periodEnd.toISOString(),
        unitsSold: s.unitsSold,
        revenueGbp: Number(s.revenueGbp),
        marginGbp: Number(s.marginGbp),
        rmaRate: Number(s.rmaRate),
      })),
      flags,
    });
  } catch (err) {
    return handleError(err);
  }
}

const PatchSchema = z.object({
  tier: z.enum(['probation', 'standard', 'preferred', 'elite']).optional(),
  status: z.enum(['active', 'review', 'suspended', 'offboarded']).optional(),
  bio: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await parseBody(request, PatchSchema);
    const b = await prisma.builder.update({ where: { builderId: params.id }, data: body });
    return ok({ builderId: b.builderId });
  } catch (err) {
    return handleError(err);
  }
}
