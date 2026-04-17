import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'builder') return bad(403, 'builders only');
    const builder = await prisma.builder.findUnique({ where: { userId: user.userId } });
    if (!builder) return bad(404, 'no builder profile');
    const queue = await prisma.buildQueue.findMany({
      where: { builderId: builder.builderId, status: { in: ['queued', 'in_progress'] } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 50,
    });
    return ok({
      items: queue.map((b) => ({
        buildQueueId: b.buildQueueId,
        orderId: b.orderId,
        status: b.status,
        priority: b.priority,
        estimatedMinutes: b.estimatedMinutes,
        items: b.items,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
