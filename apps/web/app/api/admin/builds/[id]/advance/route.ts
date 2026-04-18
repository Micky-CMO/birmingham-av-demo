import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { requireStaff } from '@/lib/session';

const Schema = z.object({
  action: z.enum(['start', 'qc', 'complete', 'fail']),
  reason: z.string().optional(),
});

/**
 * Builder action: advance a queued build through the production steps.
 * - start:    queued → in_progress
 * - qc:       in_progress → qc
 * - complete: qc → completed (also flips the order status to 'qc' or 'shipped' if everything's done)
 * - fail:     any → failed with reason
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff();
    const body = await parseBody(request, Schema);

    const queue = await prisma.buildQueue.findUnique({
      where: { buildQueueId: params.id },
      include: { order: true, builder: true },
    });
    if (!queue) return bad(404, 'Build queue row not found');

    const now = new Date();
    let newStatus: 'queued' | 'in_progress' | 'qc' | 'completed' | 'failed' = queue.status;

    switch (body.action) {
      case 'start':
        if (queue.status !== 'queued') return bad(409, `Cannot start from status ${queue.status}`);
        newStatus = 'in_progress';
        await prisma.buildQueue.update({
          where: { buildQueueId: params.id },
          data: { status: 'in_progress', startedAt: now },
        });
        await prisma.order.update({
          where: { orderId: queue.orderId },
          data: { status: 'in_build' },
        });
        break;
      case 'qc':
        if (queue.status !== 'in_progress') return bad(409, `Cannot move to QC from status ${queue.status}`);
        newStatus = 'qc';
        await prisma.buildQueue.update({ where: { buildQueueId: params.id }, data: { status: 'qc' } });
        await prisma.order.update({ where: { orderId: queue.orderId }, data: { status: 'qc' } });
        break;
      case 'complete':
        newStatus = 'completed';
        await prisma.buildQueue.update({
          where: { buildQueueId: params.id },
          data: { status: 'completed', completedAt: now },
        });
        // Mark builder stats
        await prisma.builder.update({
          where: { builderId: queue.builderId },
          data: { totalUnitsBuilt: { increment: 1 } },
        });
        // Publish completion event (ready to ship)
        await publishEvent('bav.builds.completed', {
          buildQueueId: params.id,
          orderId: queue.orderId,
          orderNumber: queue.order.orderNumber,
          builderId: queue.builderId,
        }).catch(() => undefined);
        break;
      case 'fail':
        newStatus = 'failed';
        await prisma.buildQueue.update({
          where: { buildQueueId: params.id },
          data: { status: 'failed', failureReason: body.reason ?? 'Not specified' },
        });
        break;
    }

    await prisma.auditLog.create({
      data: {
        actorType: 'staff',
        action: `build.${body.action}`,
        entityType: 'build_queue',
        entityId: params.id,
        payload: { from: queue.status, to: newStatus, reason: body.reason ?? null } as never,
      },
    });

    return ok({ buildQueueId: params.id, status: newStatus });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
