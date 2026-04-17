import { handleError, ok, bad } from '@/lib/json';
import { publishEvent } from '@/lib/events';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!secret || !key) return bad(503, 'Stripe not configured');
    if (!signature) return bad(400, 'missing signature');

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    const rawBody = await request.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      return bad(400, 'invalid signature');
    }

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

    return ok({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
