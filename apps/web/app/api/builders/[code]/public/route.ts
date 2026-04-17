import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const b = await prisma.builder.findUnique({ where: { builderCode: params.code } });
    if (!b) return bad(404, 'not found');
    return ok({
      builderCode: b.builderCode,
      displayName: b.displayName,
      tier: b.tier,
      avatarUrl: b.avatarUrl,
      bio: b.bio,
      totalUnitsBuilt: b.totalUnitsBuilt,
      qualityScore: Number(b.qualityScore),
      joinedAt: b.joinedAt.toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}
