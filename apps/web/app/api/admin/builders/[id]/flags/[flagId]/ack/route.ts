import { connectMongo, BuilderQualityFlag } from '@/lib/db';
import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';

export async function POST(_: Request, { params }: { params: { id: string; flagId: string } }) {
  try {
    const staff = await requireStaff();
    await connectMongo();
    const updated = await BuilderQualityFlag.findByIdAndUpdate(
      params.flagId,
      { $set: { acknowledgedAt: new Date(), acknowledgedBy: staff.userId } },
      { new: true },
    );
    if (!updated) return bad(404, 'flag not found');
    await prisma.builderQualityFlagAck.upsert({
      where: { flagMongoId_acknowledgedBy: { flagMongoId: params.flagId, acknowledgedBy: staff.userId } },
      create: { flagMongoId: params.flagId, acknowledgedBy: staff.userId },
      update: {},
    });
    return ok({ acknowledged: true });
  } catch (err) {
    return handleError(err);
  }
}
