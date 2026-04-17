import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const day = 86_400_000;
    const now = Date.now();
    const [ordersToday, ordersWeek, revenueMonth, openTickets, flaggedReturns, activeBuilds] = await Promise.all([
      prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: new Date(now - day) } } }),
      prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: new Date(now - 7 * day) } } }),
      prisma.order.aggregate({
        where: { status: { not: 'draft' }, createdAt: { gte: new Date(now - 30 * day) } },
        _sum: { totalGbp: true },
      }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'ai_handling', 'awaiting_customer'] } } }),
      prisma.return.count({ where: { aiFlaggedPattern: { not: null }, status: { not: 'resolved' } } }),
      prisma.buildQueue.count({ where: { status: { in: ['queued', 'in_progress'] } } }),
    ]);
    return ok({
      ordersToday,
      ordersWeek,
      revenueMonthGbp: Number(revenueMonth._sum.totalGbp ?? 0),
      openTickets,
      flaggedReturns,
      activeBuilds,
    });
  } catch (err) {
    return handleError(err);
  }
}
