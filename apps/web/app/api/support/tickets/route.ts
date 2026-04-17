import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return ok({
      items: tickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
