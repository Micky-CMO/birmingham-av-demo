import { handleError, ok } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      event_type?: string;
      [k: string]: unknown;
    } | null;

    // TODO: PayPal webhook signature verification via /v1/notifications/verify-webhook-signature
    const logged = await prisma.webhookEvent
      .create({
        data: {
          source: 'paypal',
          eventType: body?.event_type ?? 'unknown',
          payload: (body ?? {}) as unknown as object,
          signatureValid: false,
          processed: false,
        },
      })
      .catch((err) => {
        console.error('[webhooks/paypal] log failed', err);
        return null;
      });

    try {
      if (body?.event_type === 'CHECKOUT.ORDER.COMPLETED') {
        await publishEvent('bav.orders.paid', { provider: 'paypal', data: body });
      }
      if (logged) {
        await prisma.webhookEvent
          .update({ where: { eventId: logged.eventId }, data: { processed: true, processedAt: new Date() } })
          .catch(() => undefined);
      }
    } catch (err) {
      if (logged) {
        await prisma.webhookEvent
          .update({
            where: { eventId: logged.eventId },
            data: { processed: false, errorMessage: err instanceof Error ? err.message : 'processing failed' },
          })
          .catch(() => undefined);
      }
      throw err;
    }

    return ok({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
