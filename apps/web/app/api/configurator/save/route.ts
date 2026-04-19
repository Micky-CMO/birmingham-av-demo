import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Configurator save (A95). Persists a custom-build Selection as a Quote so an
 * account manager can pick it up. No payment, no inventory reservation — this
 * is the entry point to a sales conversation, not a checkout path.
 */

const SelectionSchema = z.object({
  useCase: z.enum(['gaming', 'workstation', 'creator', 'lab']),
  chassis: z.enum(['tower', 'midi', 'sff']),
  cpu: z.enum(['r7', 'r9', 'i7', 'i9']),
  gpu: z.enum(['none', '5070', '5080', '5090']),
  ram: z.enum(['32', '64', '128']),
  storage: z.enum(['1tb', '2tb', '4tb', '8tb']),
  name: z.string().max(120).optional().default(''),
  contactEmail: z.string().email(),
  contactName: z.string().min(1).max(160),
  notes: z.string().max(5000).optional().default(''),
});

const Schema = z.object({
  selection: SelectionSchema,
  totalGbp: z.number().nonnegative().max(100_000),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const { selection, totalGbp } = body;

    const current = await getCurrentUser().catch(() => null);
    const quoteNumber = await nextQuoteNumber();

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        businessAccountId: null,
        userId: current?.userId ?? null,
        contactEmail: selection.contactEmail.trim().toLowerCase(),
        contactName: selection.contactName,
        itemsJson: {
          source: 'configurator',
          selection,
          totalGbp,
        },
        requiredBy: null,
        shippingAddress: { raw: '' },
        budgetBand: String(totalGbp),
        notes: selection.notes || null,
        amountGbp: totalGbp,
      },
    });

    return ok({ quoteNumber: quote.quoteNumber }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

async function nextQuoteNumber(): Promise<string> {
  const n = await prisma.quote.count();
  return `BAV-Q-${String(n + 1).padStart(6, '0')}`;
}
