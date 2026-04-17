import { connectMongo, BuilderQualityFlag } from '@/lib/db';
import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';

export async function POST(_: Request, { params }: { params: { id: string; flagId: string } }) {
  try {
    await requireStaff();
    await connectMongo();
    const updated = await BuilderQualityFlag.findByIdAndUpdate(
      params.flagId,
      { $set: { resolvedAt: new Date() } },
      { new: true },
    );
    if (!updated) return bad(404, 'flag not found');
    // Clear the flagged_by_ai bit if no open flags remain
    const stillOpen = await BuilderQualityFlag.countDocuments({
      postgresBuilderId: params.id,
      resolvedAt: { $exists: false },
    });
    if (stillOpen === 0) {
      await prisma.builder.update({ where: { builderId: params.id }, data: { flaggedByAi: false, lastFlagReason: null } });
    }
    return ok({ resolved: true });
  } catch (err) {
    return handleError(err);
  }
}
