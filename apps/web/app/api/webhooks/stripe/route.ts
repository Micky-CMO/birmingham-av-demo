import { handleError, ok, bad } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!secret || !key) return bad(503, 'Stripe not configured');
    if (!signature) return bad(400, 'missing signature');

    const StripeModule = await import('stripe');
    const Stripe = StripeModule.default;
    type StripeEvent = import('stripe').Stripe.Event;
    const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    const rawBody = await request.text();
    let event: StripeEvent;
    let signatureValid = false;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      signatureValid = true;
    } catch (err) {
      // Log the attempt so we can audit bad-signature noise, then bail out.
      await prisma.webhookEvent
        .create({
          data: {
            source: 'stripe',
            eventType: 'unknown',
            payload: { rawBody: rawBody.slice(0, 2000) },
            signatureValid: false,
            processed: false,
            errorMessage: 'invalid signature',
          },
        })
        .catch(() => undefined);
      return bad(400, 'invalid signature');
    }

    const logged = await prisma.webhookEvent
      .create({
        data: {
          source: 'stripe',
          eventType: event.type,
          payload: event as unknown as object,
          signatureValid,
          processed: false,
        },
      })
      .catch((err) => {
        console.error('[webhooks/stripe] log failed', err);
        return null;
      });

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await publishEvent('bav.orders.paid', { stripeId: event.id, data: event.data.object });
          break;
        case 'charge.refunded':
          await publishEvent('bav.orders.refunded', { stripeId: event.id, data: event.data.object });
          break;
        default:
          break;
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
