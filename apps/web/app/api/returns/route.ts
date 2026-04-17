import { CreateReturnSchema } from '@bav/lib/schemas';
import { returnNumber } from '@bav/lib';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const body = await parseBody(request, CreateReturnSchema);

    const item = await prisma.orderItem.findUnique({
      where: { orderItemId: body.orderItemId },
      include: { order: true, builder: true, product: true, unit: true },
    });
    if (!item || item.order.userId !== user.userId) return bad(404, 'order item not found');

    const created = await prisma.return.create({
      data: {
        returnNumber: returnNumber(),
        orderItemId: item.orderItemId,
        orderId: item.orderId,
        unitId: item.unitId,
        builderId: item.builderId,
        productId: item.productId,
        requestedByUserId: user.userId,
        reason: body.reason,
        reasonDetails: body.reasonDetails ?? null,
        refundAmountGbp: Number(item.pricePerUnitGbp) * item.qty,
      },
    });

    await publishEvent('bav.returns.created', { returnId: created.returnId, returnNumber: created.returnNumber });
    return ok({ returnNumber: created.returnNumber }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
