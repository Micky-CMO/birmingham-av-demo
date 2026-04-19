import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Quote request (Batch 11 / A73).
 *
 * Accepts freeform or row-based line items. Captures the quote under the
 * current user's BusinessAccount if one exists; otherwise it stays attached
 * to the userId (for signed-in personal accounts) or neither (anonymous).
 * An account manager reviews each submission manually.
 */

const RowSchema = z.object({
  qty: z.union([z.number().int().positive(), z.string()]),
  spec: z.string().min(1).max(500),
  productId: z.string().uuid().optional(),
});

const Schema = z.object({
  company: z.string().min(1).max(200),
  vatNumber: z
    .string()
    .max(32)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  contactName: z.string().min(1).max(160),
  email: z.string().email(),
  phone: z.string().min(4).max(32),
  mode: z.enum(['rows', 'freeform']),
  freeform: z.string().max(5000).optional(),
  rows: z.array(RowSchema).optional(),
  neededBy: z.string().optional(),
  shipAddress: z.string().max(2000).optional(),
  multipleShips: z.boolean().optional(),
  budgetGbp: z.string().max(32).optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);

    const items =
      body.mode === 'rows'
        ? (body.rows ?? []).filter((r) => String(r.spec).trim().length > 0)
        : [{ qty: 1, spec: body.freeform ?? '' }];

    const current = await getCurrentUser().catch(() => null);
    const businessAccount = current
      ? await prisma.businessAccount.findUnique({ where: { userId: current.userId } })
      : null;

    const quoteNumber = await nextQuoteNumber();

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        businessAccountId: businessAccount?.businessAccountId ?? null,
        userId: current?.userId ?? null,
        contactEmail: body.email.trim().toLowerCase(),
        contactName: body.contactName,
        itemsJson: { mode: body.mode, items, company: body.company, vatNumber: body.vatNumber ?? null, phone: body.phone },
        requiredBy: body.neededBy ? new Date(body.neededBy) : null,
        shippingAddress: {
          raw: body.shipAddress ?? '',
          multipleShips: Boolean(body.multipleShips),
        },
        budgetBand: body.budgetGbp ?? null,
        notes: body.notes ?? null,
      },
    });

    // TODO: send "quote received" email once the template exists.

    return ok({ quoteNumber: quote.quoteNumber }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Generate a BAV-Q-000127 style sequence. Counts existing quotes and pads.
 * Collision-safe enough for single-digit concurrent writes; fine until
 * we swap in a Postgres sequence properly.
 */
async function nextQuoteNumber(): Promise<string> {
  const n = await prisma.quote.count();
  return `BAV-Q-${String(n + 1).padStart(6, '0')}`;
}
