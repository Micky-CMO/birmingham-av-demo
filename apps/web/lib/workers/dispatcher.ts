import type { BavEvent } from '../events';
import { notifyTelegramOwner } from '../telegram';
import { sendEmail } from '../email';
import { prisma } from '../db';
import { analyseReturnWorker } from './return-analyzer';
import { builderSnapshotWorker } from './builder-snapshots';

export async function dispatchLocalWorker(event: BavEvent, payload: Record<string, unknown>): Promise<void> {
  switch (event) {
    case 'bav.orders.paid': {
      const data = payload.data as { metadata?: Record<string, string> } | undefined;
      console.log('[worker] order paid', data?.metadata);
      return;
    }
    case 'bav.returns.created': {
      await analyseReturnWorker(payload as { returnId?: string });
      return;
    }
    case 'bav.support.escalated': {
      const { ticketNumber, reason } = payload as { ticketNumber?: string; reason?: string };
      await notifyTelegramOwner(
        `*Support escalation* \n*Ticket:* ${ticketNumber ?? '?'}\n*Reason:* ${reason ?? '?'}\n${process.env.NEXTAUTH_URL ?? ''}/admin/support?ticket=${ticketNumber ?? ''}`,
      );
      await sendEmail(
        'support@birmingham-av.com',
        `[Escalation] ${ticketNumber ?? '?'}`,
        `<p>Ticket escalated. Reason: ${reason ?? '?'}.</p>`,
      );
      return;
    }
    case 'bav.builders.snapshot_due': {
      await builderSnapshotWorker();
      return;
    }
    case 'bav.orders.shipped': {
      const { orderNumber } = payload as { orderNumber?: string };
      if (orderNumber) {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          include: { user: { select: { email: true } } },
        });
        if (order) {
          await sendEmail(
            order.user.email,
            `Your BAV order ${order.orderNumber} has shipped`,
            `<p>Track it at ${process.env.NEXTAUTH_URL ?? 'https://birmingham-av.com'}/orders/${order.orderNumber}.</p>`,
          );
        }
      }
      return;
    }
    default:
      return;
  }
}
