import { bad } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Gift-card purchase (Batch 11 / A75) — stub.
 *
 * TODO: wire up to Stripe Checkout. Flow once implemented:
 *   1. Validate recipient + amount.
 *   2. Create a pending GiftCard row with a unique BAV-GIFT-XXXX-XXXX code.
 *   3. Return a Stripe Checkout session URL for payment.
 *   4. On payment webhook, flip the card active and schedule the delivery
 *      email via bavEmail (if deliverAt in the future) or send immediately.
 */
export async function POST() {
  return bad(501, 'Gift card purchase not yet implemented — Stripe integration pending.');
}
