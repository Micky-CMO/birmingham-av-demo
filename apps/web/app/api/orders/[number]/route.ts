import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { number: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const order = await prisma.order.findFirst({
      where: { orderNumber: params.number, userId: user.userId },
      include: { items: { include: { product: { select: { title: true, slug: true } }, builder: { select: { displayName: true, builderCode: true } } } } },
    });
    if (!order) return bad(404, 'not found');
    return ok({
      orderNumber: order.orderNumber,
      status: order.status,
      totalGbp: Number(order.totalGbp),
      subtotalGbp: Number(order.subtotalGbp),
      shippingGbp: Number(order.shippingGbp),
      taxGbp: Number(order.taxGbp),
      items: order.items.map((i) => ({
        title: i.product.title,
        slug: i.product.slug,
        qty: i.qty,
        builder: i.builder.displayName,
        builderCode: i.builder.builderCode,
        pricePerUnitGbp: Number(i.pricePerUnitGbp),
      })),
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}
