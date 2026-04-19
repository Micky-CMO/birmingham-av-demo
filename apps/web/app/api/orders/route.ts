import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const orders = await prisma.order.findMany({
      where: { userId: user.userId, status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok({
      items: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        totalGbp: Number(o.totalGbp),
        placedAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
