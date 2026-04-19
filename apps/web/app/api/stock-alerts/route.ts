import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Stock alerts (A96).
 *
 * POST /api/stock-alerts — subscribe an email to be notified when a product
 * returns to stock. Idempotent per (productId, email) thanks to the unique
 * index on the StockAlert model; a duplicate request updates the row back to
 * `pending` so a second notification can fire if the earlier one was already
 * sent and the product has since sold out again.
 */

const Schema = z.object({
  productId: z.string().uuid(),
  email: z.string().email().max(320),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const email = body.email.trim().toLowerCase();

    // Confirm the product exists — we don't want the alerts table to fill with
    // orphans if someone calls the API directly with a dead ID.
    const product = await prisma.product.findUnique({
      where: { productId: body.productId },
      select: { productId: true, isActive: true },
    });
    if (!product) {
      return handleError(new Response(JSON.stringify({ error: { message: 'product not found' } }), { status: 404 }));
    }

    const current = await getCurrentUser().catch(() => null);

    const alert = await prisma.stockAlert.upsert({
      where: {
        productId_email: {
          productId: body.productId,
          email,
        },
      },
      create: {
        productId: body.productId,
        email,
        userId: current?.userId ?? null,
        status: 'pending',
      },
      update: {
        status: 'pending',
        notifiedAt: null,
        userId: current?.userId ?? undefined,
      },
      select: { stockAlertId: true, status: true },
    });

    return ok({ stockAlertId: alert.stockAlertId, status: alert.status }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
