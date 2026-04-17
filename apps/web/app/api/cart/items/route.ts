import { AddToCartSchema } from '@bav/lib/schemas';
import { prisma } from '@/lib/db';
import { anonSessionToken } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, AddToCartSchema);
    const product = await prisma.product.findUnique({
      where: { productId: body.productId },
      include: { inventory: true },
    });
    if (!product || !product.isActive) return bad(404, 'product not found');
    const stock = product.inventory?.stockQty ?? 0;
    if (stock < body.qty) return bad(409, 'insufficient stock');

    const token = anonSessionToken();
    const now = new Date();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const cart = await prisma.cartSession.upsert({
      where: { sessionToken: token },
      update: {
        expiresAt: expires,
        items: appendItem([], body),
      },
      create: {
        sessionToken: token,
        items: [{ productId: body.productId, qty: body.qty, pricePerUnitGbp: Number(product.priceGbp) }],
        expiresAt: expires,
      },
    });
    // Simple subtotal recomputation
    const items = (cart.items as Array<{ productId: string; qty: number; pricePerUnitGbp: number }>) ?? [];
    const subtotal = items.reduce((s, i) => s + i.pricePerUnitGbp * i.qty, 0);
    await prisma.cartSession.update({
      where: { cartId: cart.cartId },
      data: { subtotalGbp: subtotal, updatedAt: now },
    });
    return ok({ cartId: cart.cartId, items, subtotalGbp: subtotal });
  } catch (err) {
    return handleError(err);
  }
}

function appendItem(
  current: Array<{ productId: string; qty: number; pricePerUnitGbp: number }>,
  next: { productId: string; qty: number },
) {
  const found = current.find((c) => c.productId === next.productId);
  if (found) found.qty = Math.min(10, found.qty + next.qty);
  else current.push({ productId: next.productId, qty: next.qty, pricePerUnitGbp: 0 });
  return current;
}
