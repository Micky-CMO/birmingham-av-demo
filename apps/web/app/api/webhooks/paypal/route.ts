import { handleError, ok } from '@/lib/json';
import { publishEvent } from '@/lib/events';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    // TODO: PayPal webhook signature verification via /v1/notifications/verify-webhook-signature
    if (body?.event_type === 'CHECKOUT.ORDER.COMPLETED') {
      await publishEvent('bav.orders.paid', { provider: 'paypal', data: body });
    }
    return ok({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
