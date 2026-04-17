import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const b = await prisma.builder.findUnique({
      where: { userId: user.userId },
      include: { warehouseNode: true },
    });
    if (!b) return bad(404, 'no builder profile');
    return ok({
      builderId: b.builderId,
      builderCode: b.builderCode,
      displayName: b.displayName,
      tier: b.tier,
      status: b.status,
      warehouseNodeCode: b.warehouseNode.nodeCode,
      qualityScore: Number(b.qualityScore),
      rmaRate90d: Number(b.rmaRateRolling90d),
      totalUnitsBuilt: b.totalUnitsBuilt,
    });
  } catch (err) {
    return handleError(err);
  }
}
