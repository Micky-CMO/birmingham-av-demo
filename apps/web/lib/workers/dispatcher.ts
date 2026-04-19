import type { BavEvent } from '../events';
import { notifyTelegramOwner } from '../telegram';
import { sendEmail as sendLegacyEmail } from '../email';
import { bavEmail } from '../email/send';
import { prisma } from '../db';
import { analyseReturnWorker } from './return-analyzer';
import { builderSnapshotWorker } from './builder-snapshots';

/**
 * Event handler for local dev + fallback paths. In production, EventBridge
 * fans out these events to dedicated Lambda workers. Locally, this single
 * dispatcher owns every event response.
 */
export async function dispatchLocalWorker(event: BavEvent, payload: Record<string, unknown>): Promise<void> {
  switch (event) {
    case 'bav.orders.paid': {
      const { orderNumber } = payload as { orderNumber?: string };
      if (!orderNumber) return;
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: true,
          items: {
            include: {
              product: { include: { builder: true } },
            },
          },
        },
      });
      if (!order || !order.user.email) return;

      const shipping = order.shippingAddress as {
        line1?: string;
        line2?: string | null;
        city?: string;
        postcode?: string;
        countryIso2?: string;
      } | null;

      const items = order.items.map((it) => ({
        productId: it.productId ?? '',
        title: it.product?.title ?? 'Birmingham AV build',
        subtitle: it.product?.subtitle ?? null,
        buildNumber: it.product?.sku?.match(/(\d+)\s*$/)?.[1]?.padStart(3, '0').slice(-3),
        qty: it.qty,
        pricePerUnitGbp: Number(it.pricePerUnitGbp),
      }));
      const builderNames = Array.from(
        new Set(order.items.map((it) => it.product?.builder?.displayName).filter((n): n is string => !!n)),
      );

      await bavEmail.orderConfirmation(order.user.email, {
        customerFirstName: order.user.firstName ?? 'friend',
        orderNumber: order.orderNumber,
        items,
        subtotalGbp: Number(order.subtotalGbp ?? 0),
        shippingGbp: Number(order.shippingGbp ?? 0),
        totalGbp: Number(order.totalGbp ?? 0),
        builderNames,
        estimatedDispatchDate: estimateDispatchDate(),
        shippingAddress: {
          line1: shipping?.line1 ?? '',
          line2: shipping?.line2 ?? null,
          city: shipping?.city ?? '',
          postcode: shipping?.postcode ?? '',
          countryIso2: shipping?.countryIso2 ?? 'GB',
        },
        orderTrackingUrl: `${appUrl()}/account/orders/${order.orderNumber}`,
      });
      return;
    }

    case 'bav.orders.shipped': {
      const { orderNumber, courier, trackingNumber, trackingUrl } = payload as {
        orderNumber?: string;
        courier?: string;
        trackingNumber?: string;
        trackingUrl?: string;
      };
      if (!orderNumber) return;
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: true,
          items: {
            include: { product: { include: { builder: true } } },
          },
        },
      });
      if (!order || !order.user.email) return;
      const firstBuilder = order.items[0]?.product?.builder?.displayName ?? null;

      await bavEmail.dispatched(order.user.email, {
        customerFirstName: order.user.firstName ?? 'friend',
        orderNumber: order.orderNumber,
        courier: courier ?? 'DPD',
        trackingNumber: trackingNumber ?? '—',
        trackingUrl: trackingUrl ?? `${appUrl()}/account/orders/${order.orderNumber}`,
        estimatedDeliveryDate: estimateDeliveryDate(),
        itemCount: order.items.length,
        builderName: firstBuilder,
      });
      return;
    }

    case 'bav.orders.delivered': {
      const { orderNumber } = payload as { orderNumber?: string };
      if (!orderNumber) return;
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: true,
          items: {
            take: 1,
            include: { product: { include: { builder: true } } },
          },
        },
      });
      if (!order || !order.user.email) return;
      const first = order.items[0];
      if (!first?.product) return;
      const buildNumber = first.product.sku?.match(/(\d+)\s*$/)?.[1]?.padStart(3, '0').slice(-3);

      await bavEmail.delivered(order.user.email, {
        customerFirstName: order.user.firstName ?? 'friend',
        orderNumber: order.orderNumber,
        productTitle: first.product.title,
        buildNumber,
        builderName: first.product.builder?.displayName ?? null,
        reviewUrl: `${appUrl()}/product/${first.product.slug}/review?order=${order.orderNumber}`,
        returnUrl: `${appUrl()}/returns/new?order=${order.orderNumber}`,
      });
      return;
    }

    case 'bav.returns.created': {
      await analyseReturnWorker(payload as { returnId?: string });
      return;
    }

    case 'bav.support.escalated': {
      const { ticketNumber, reason } = payload as { ticketNumber?: string; reason?: string };
      await notifyTelegramOwner(
        `*Support escalation* \n*Ticket:* ${ticketNumber ?? '?'}\n*Reason:* ${reason ?? '?'}\n${appUrl()}/admin/support?ticket=${ticketNumber ?? ''}`,
      );
      await sendLegacyEmail(
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

    default:
      return;
  }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://birmingham-av.com';
}

function estimateDispatchDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function estimateDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
