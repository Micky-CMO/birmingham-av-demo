import { SupportMessageSchema } from '@bav/lib/schemas';
import { ticketNumber } from '@bav/lib';
import { prisma } from '@/lib/db';
import { connectMongo, ChatTranscript } from '@/lib/db';
import { getCurrentUser, anonSessionToken } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { runSupportTurn } from '@bav/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, SupportMessageSchema);
    const user = await getCurrentUser();

    // We need a user row to persist the ticket. For anonymous chatters in dev, use a pseudo user.
    let userId: string;
    if (user) {
      userId = user.userId;
    } else {
      const anonEmail = `anon-${anonSessionToken().slice(0, 12)}@birmingham-av.local`;
      const row = await prisma.user.upsert({
        where: { email: anonEmail },
        update: {},
        create: { email: anonEmail, role: 'customer' },
      });
      userId = row.userId;
    }

    let ticket = body.ticketId
      ? await prisma.supportTicket.findUnique({ where: { ticketId: body.ticketId } })
      : null;
    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber: ticketNumber(),
          userId,
          subject: body.subject ?? (body.body.slice(0, 80) || 'Support chat'),
          channel: 'web_widget',
          status: 'ai_handling',
        },
      });
      await publishEvent('bav.support.ticket_opened', { ticketNumber: ticket.ticketNumber });
    }

    await prisma.supportMessage.create({
      data: { ticketId: ticket.ticketId, senderType: 'user', senderUserId: userId, body: body.body },
    });

    const history = await prisma.supportMessage.findMany({
      where: { ticketId: ticket.ticketId },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    let reply = '';
    let escalated = false;
    let modelId = 'rule-based';

    // runSupportTurn now has its own provider fallback chain (Claude → Gemini → rule-based)
    // and never throws for missing keys. It always returns a usable reply.
    try {
      const turn = await runSupportTurn({
        ticketId: ticket.ticketId,
        userId,
        history: history.map((m) => ({
          role: m.senderType === 'user' ? 'user' : m.senderType === 'ai' ? 'assistant' : 'system',
          content: m.body,
        })),
        toolHandlers: {
          escalate_to_human: async ({ reason, severity }) => {
            await prisma.supportTicket.update({
              where: { ticketId: ticket!.ticketId },
              data: { status: 'escalated_human', aiEscalatedReason: reason },
            });
            await publishEvent('bav.support.escalated', {
              ticketNumber: ticket!.ticketNumber,
              reason,
              severity,
            });
            return { ok: true };
          },
        },
      });
      reply = turn.reply;
      escalated = turn.escalated;
      modelId = turn.model;

      await prisma.supportMessage.create({
        data: {
          ticketId: ticket.ticketId,
          senderType: 'ai',
          body: turn.reply,
          tokensIn: turn.tokensIn,
          tokensOut: turn.tokensOut,
          modelId: turn.model,
        },
      });
    } catch (err) {
      console.error('[support] AI turn failed', err);
      reply = 'Thanks — a human will follow up shortly.';
      escalated = true;
      await prisma.supportTicket.update({
        where: { ticketId: ticket.ticketId },
        data: { status: 'escalated_human', aiEscalatedReason: 'AI backend error' },
      });
      await publishEvent('bav.support.escalated', { ticketNumber: ticket.ticketNumber, reason: 'AI backend error' });
    }

    // Persist to Mongo transcript (optional — gracefully skip if MONGO_URL is absent)
    if (process.env.MONGO_URL) {
      try {
        const conn = await connectMongo();
        if (conn) {
          await ChatTranscript.findOneAndUpdate(
            { postgresTicketId: ticket.ticketId },
            {
              $setOnInsert: { postgresTicketId: ticket.ticketId, postgresUserId: userId },
              $push: {
                messages: {
                  $each: [
                    { senderType: 'user', senderUserId: userId, body: body.body, sentAt: new Date() },
                    ...(reply ? [{ senderType: 'ai', body: reply, sentAt: new Date() }] : []),
                  ],
                },
              },
            },
            { upsert: true, new: true },
          );
        }
      } catch (err) {
        console.warn('[support] mongo transcript write skipped:', (err as Error).message);
      }
    }

    return ok({
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      reply,
      escalated,
      model: modelId,
    });
  } catch (err) {
    return handleError(err);
  }
}
