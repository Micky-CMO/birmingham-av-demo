import { prisma } from '@/lib/db';
import { anonSessionToken } from '@/lib/session';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const token = anonSessionToken();
    const cart = await prisma.cartSession.findUnique({ where: { sessionToken: token } });
    return ok({
      cartId: cart?.cartId ?? null,
      items: cart?.items ?? [],
      subtotalGbp: cart ? Number(cart.subtotalGbp) : 0,
      expiresAt: cart?.expiresAt.toISOString() ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}
