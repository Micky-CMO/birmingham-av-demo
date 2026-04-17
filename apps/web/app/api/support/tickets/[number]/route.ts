import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { number: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const ticket = await prisma.supportTicket.findFirst({
      where: { ticketNumber: params.number, userId: user.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return bad(404, 'not found');
    return ok({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      messages: ticket.messages.map((m) => ({
        senderType: m.senderType,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
