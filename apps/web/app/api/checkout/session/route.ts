import { CreateCheckoutSchema } from '@bav/lib/schemas';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, CreateCheckoutSchema);

    if (!process.env.STRIPE_SECRET_KEY) {
      return bad(503, 'Stripe key not configured', {
        hint: 'Set STRIPE_SECRET_KEY in .env.local to enable card payments.',
      });
    }

    // Dynamic import so builds without the key still succeed
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
    const intent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'gbp',
      capture_method: 'automatic',
      automatic_payment_methods: { enabled: true },
      metadata: { bav_shipping: JSON.stringify(body.shipping) },
    });
    return ok({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    return handleError(err);
  }
}
