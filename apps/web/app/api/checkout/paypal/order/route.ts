import { bad, handleError, ok } from '@/lib/json';

export async function POST() {
  try {
    if (!process.env.PAYPAL_CLIENT_ID) {
      return bad(503, 'PayPal not configured', { hint: 'Set PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET in .env.local.' });
    }
    // Real implementation: call PayPal /v2/checkout/orders
    return ok({ orderId: 'paypal-todo', approvalUrl: 'https://www.paypal.com/checkoutnow?token=paypal-todo' });
  } catch (err) {
    return handleError(err);
  }
}
