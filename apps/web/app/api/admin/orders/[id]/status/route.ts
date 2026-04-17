import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';

const Schema = z.object({
  status: z.enum(['queued', 'in_build', 'qc', 'shipped', 'delivered', 'cancelled']),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await parseBody(request, Schema);
    const o = await prisma.order.update({
      where: { orderId: params.id },
      data: {
        status: body.status,
        shippedAt: body.status === 'shipped' ? new Date() : undefined,
        deliveredAt: body.status === 'delivered' ? new Date() : undefined,
        cancelledAt: body.status === 'cancelled' ? new Date() : undefined,
      },
    });
    if (body.status === 'shipped') await publishEvent('bav.orders.shipped', { orderNumber: o.orderNumber });
    if (body.status === 'delivered') await publishEvent('bav.orders.delivered', { orderNumber: o.orderNumber });
    return ok({ orderNumber: o.orderNumber, status: o.status });
  } catch (err) {
    return handleError(err);
  }
}
