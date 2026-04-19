import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { number: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const r = await prisma.return.findFirst({
      where: { returnNumber: params.number, requestedByUserId: user.userId },
      include: { product: { select: { title: true } } },
    });
    if (!r) return bad(404, 'not found');
    return ok({
      returnNumber: r.returnNumber,
      status: r.status,
      reason: r.reason,
      refundAmountGbp: Number(r.refundAmountGbp),
      product: r.product.title,
      createdAt: r.createdAt.toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}
