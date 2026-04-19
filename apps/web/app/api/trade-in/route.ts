import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const TradeInSchema = z.object({
  itemType: z.enum(['desktop', 'laptop', 'monitor', 'allinone', 'other']),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  condition: z.enum(['like-new', 'excellent', 'good', 'fair', 'not-working']),
  contactName: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Rough provisional estimate used for the confirmation page. The offer the
 * team actually makes replaces this after inspection. Deliberately coarse —
 * a starting point, not a promise.
 */
function estimateFor(itemType: string, condition: string): number {
  const typeBase: Record<string, number> = {
    desktop: 220,
    laptop: 180,
    monitor: 60,
    allinone: 240,
    other: 80,
  };
  const conditionMultiplier: Record<string, number> = {
    'like-new': 1.3,
    excellent: 1.0,
    good: 0.65,
    fair: 0.35,
    'not-working': 0.1,
  };
  const base = typeBase[itemType] ?? 80;
  const mult = conditionMultiplier[condition] ?? 0.5;
  return Math.round(base * mult);
}

/**
 * POST /api/trade-in — creates a TradeInRequest row. Returns a short
 * reference + the provisional estimate for the client to display.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const body = await parseBody(request, TradeInSchema);
    const estimate = estimateFor(body.itemType, body.condition);

    const row = await prisma.tradeInRequest.create({
      data: {
        userId: user?.userId ?? null,
        email: body.email,
        contactName: body.contactName,
        phone: body.phone ?? null,
        itemType: body.itemType,
        brand: body.brand,
        model: body.model,
        condition: body.condition,
        estimateGbp: estimate,
        notes: body.notes ?? null,
      },
    });

    const reference = `TI-${row.tradeInRequestId.slice(0, 8).toUpperCase()}`;

    return ok({ reference, estimateGbp: estimate, tradeInRequestId: row.tradeInRequestId });
  } catch (err) {
    return handleError(err);
  }
}
