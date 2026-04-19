import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

const SubscribeBodySchema = z.object({
  tier: z.enum(['essential', 'plus']),
});

/**
 * AV Care subscribe — stub.
 *
 * TODO: wire Stripe Checkout Session. For now we accept a tier and return
 * `checkoutUrl: null` so the UI can render a "payment coming soon" state
 * without erroring. Real flow (see briefing §7):
 *   1. Create-or-retrieve Stripe customer for user.
 *   2. Create a Checkout Session for the tier's price ID (14.99 or 29.99)
 *      with a 30-day trial and metadata.userId.
 *   3. Persist AvCareSubscription(row=trialing, stripeCustomerId, priceId).
 *   4. Return { checkoutUrl: session.url }.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const body = await parseBody(request, SubscribeBodySchema);

    return ok(
      {
        checkoutUrl: null,
        tier: body.tier,
        note: 'TODO: wire Stripe Checkout Session — returns null while payment integration lands',
      },
      { status: 501 },
    );
  } catch (err) {
    return handleError(err);
  }
}
