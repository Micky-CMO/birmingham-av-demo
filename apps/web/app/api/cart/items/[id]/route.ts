import { z } from 'zod';
import { prisma } from '@/lib/db';
import { anonSessionToken } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

const UpdateSchema = z.object({ qty: z.number().int().min(1).max(10) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await parseBody(request, UpdateSchema);
    const token = anonSessionToken();
    const cart = await prisma.cartSession.findUnique({ where: { sessionToken: token } });
    if (!cart) return bad(404, 'no cart');
    const items = (cart.items as Array<{ productId: string; qty: number; pricePerUnitGbp: number }>) ?? [];
    const line = items.find((i) => i.productId === params.id);
    if (!line) return bad(404, 'line not in cart');
    line.qty = body.qty;
    await prisma.cartSession.update({
      where: { cartId: cart.cartId },
      data: { items, subtotalGbp: items.reduce((s, i) => s + i.pricePerUnitGbp * i.qty, 0) },
    });
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const token = anonSessionToken();
    const cart = await prisma.cartSession.findUnique({ where: { sessionToken: token } });
    if (!cart) return bad(404, 'no cart');
    const items = (cart.items as Array<{ productId: string; qty: number; pricePerUnitGbp: number }>) ?? [];
    const next = items.filter((i) => i.productId !== params.id);
    await prisma.cartSession.update({
      where: { cartId: cart.cartId },
      data: { items: next, subtotalGbp: next.reduce((s, i) => s + i.pricePerUnitGbp * i.qty, 0) },
    });
    return ok({ items: next });
  } catch (err) {
    return handleError(err);
  }
}
