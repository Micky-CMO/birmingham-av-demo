import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { requireStaff } from '@/lib/session';

const Schema = z.object({
  status: z.enum(['queued', 'in_build', 'qc', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().max(500).optional(),
  trackingNumber: z.string().optional(),
});

/**
 * Staff-only endpoint to transition an order through its lifecycle.
 * Fires the corresponding event so builders get notified, customers get emailed,
 * and the activity feed updates.
 */
export async function PATCH(request: Request, { params }: { params: { number: string } }) {
  try {
    await requireStaff();
    const body = await parseBody(request, Schema);

    const existing = await prisma.order.findUnique({
      where: { orderNumber: params.number },
      include: { items: true, user: true },
    });
    if (!existing) return bad(404, 'Order not found');

    const now = new Date();
    const updated = await prisma.order.update({
      where: { orderNumber: params.number },
      data: {
        status: body.status,
        shippedAt: body.status === 'shipped' ? now : undefined,
        deliveredAt: body.status === 'delivered' ? now : undefined,
        cancelledAt: body.status === 'cancelled' ? now : undefined,
      },
    });

    // If shipping, decrement stock (we were only RESERVING it until now)
    if (body.status === 'shipped') {
      for (const item of existing.items) {
        await prisma.productInventory.update({
          where: { productId: item.productId },
          data: {
            stockQty: { decrement: item.qty },
            reservedQty: { decrement: item.qty },
          },
        });
      }
    }
    // If cancelling before ship, release the reservation
    if (body.status === 'cancelled' && existing.status !== 'shipped' && existing.status !== 'delivered') {
      for (const item of existing.items) {
        await prisma.productInventory.update({
          where: { productId: item.productId },
          data: { reservedQty: { decrement: item.qty } },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorType: 'staff',
        action: `order.status.${body.status}`,
        entityType: 'order',
        entityId: updated.orderId,
        payload: { from: existing.status, to: body.status, notes: body.notes ?? null } as never,
      },
    });

    // Fire event
    const eventMap = {
      queued: 'bav.orders.paid',
      in_build: 'bav.orders.paid',
      qc: 'bav.orders.paid',
      shipped: 'bav.orders.shipped',
      delivered: 'bav.orders.delivered',
      cancelled: 'bav.orders.refunded',
    } as const;
    await publishEvent(eventMap[body.status], {
      orderNumber: updated.orderNumber,
      orderId: updated.orderId,
      status: body.status,
      userId: existing.userId,
      trackingNumber: body.trackingNumber ?? null,
    }).catch((err) => console.warn('[orders/status] event failed', err));

    return ok({ orderNumber: updated.orderNumber, status: updated.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
