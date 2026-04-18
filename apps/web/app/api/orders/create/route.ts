import { z } from 'zod';
import { prisma } from '@/lib/db';
import { orderNumber } from '@bav/lib';
import { anonSessionToken, getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { AddressSchema } from '@bav/lib/schemas';

const CreateOrderSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  shipping: AddressSchema,
  billing: AddressSchema.optional(),
  customerNotes: z.string().max(500).optional(),
  preferredBuilderCode: z.string().optional(),
  paymentMethod: z.enum(['stripe_card', 'paypal', 'manual']).default('manual'),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, CreateOrderSchema);

    // Resolve / upsert the customer
    let userId: string;
    const authed = await getCurrentUser();
    if (authed) {
      userId = authed.userId;
    } else {
      const u = await prisma.user.upsert({
        where: { email: body.email },
        update: {},
        create: {
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone ?? null,
        },
      });
      userId = u.userId;
    }

    // Fetch product data for each line + verify stock
    const productIds = body.lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: { productId: { in: productIds }, isActive: true },
      include: { inventory: true, builder: true },
    });
    if (products.length !== productIds.length) {
      return bad(404, 'One or more products not found or inactive');
    }
    const byId = new Map(products.map((p) => [p.productId, p]));

    // Stock check + build line snapshot
    const lines: Array<{
      productId: string;
      builderId: string;
      qty: number;
      pricePerUnitGbp: number;
      costPerUnitGbp: number;
    }> = [];
    for (const l of body.lines) {
      const p = byId.get(l.productId)!;
      const available = (p.inventory?.stockQty ?? 0) - (p.inventory?.reservedQty ?? 0);
      if (available < l.qty) {
        return bad(409, `Not enough stock for "${p.title}": ${available} available, ${l.qty} requested`);
      }
      lines.push({
        productId: p.productId,
        builderId: p.builderId,
        qty: l.qty,
        pricePerUnitGbp: Number(p.priceGbp),
        costPerUnitGbp: Number(p.costGbp),
      });
    }

    // Totals
    const subtotal = lines.reduce((s, l) => s + l.pricePerUnitGbp * l.qty, 0);
    const shipping = 0; // Free UK shipping over £50 — simplified
    const tax = Math.round(subtotal * 0.2 * 100) / 100; // 20% VAT on the subtotal
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    // Resolve preferred builder override if passed
    let preferredBuilderId: string | undefined;
    if (body.preferredBuilderCode) {
      const pb = await prisma.builder.findUnique({ where: { builderCode: body.preferredBuilderCode } });
      if (pb) preferredBuilderId = pb.builderId;
    }

    // Create order + items + decrement stock + create build queue rows — all in one transaction
    const orderNo = orderNumber();
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: orderNo,
          userId,
          status: 'paid',
          subtotalGbp: subtotal,
          shippingGbp: shipping,
          taxGbp: tax,
          totalGbp: total,
          currency: 'GBP',
          paymentMethod: body.paymentMethod,
          paymentCapturedAt: new Date(),
          shippingAddress: body.shipping as never,
          billingAddress: (body.billing ?? body.shipping) as never,
          customerNotes: body.customerNotes ?? null,
          queuedForBuildAt: new Date(),
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              builderId: preferredBuilderId ?? l.builderId,
              qty: l.qty,
              pricePerUnitGbp: l.pricePerUnitGbp,
              costPerUnitGbp: l.costPerUnitGbp,
            })),
          },
        },
        include: { items: { include: { builder: { include: { warehouseNode: true } } } } },
      });

      // Reserve stock (don't decrement outright — decrement on shipment)
      for (const l of lines) {
        await tx.productInventory.update({
          where: { productId: l.productId },
          data: { reservedQty: { increment: l.qty } },
        });
      }

      // Create one BuildQueue row per unique builder on the order
      const byBuilder = new Map<string, typeof order.items>();
      for (const item of order.items) {
        const key = item.builderId;
        if (!byBuilder.has(key)) byBuilder.set(key, []);
        byBuilder.get(key)!.push(item);
      }
      for (const [builderId, items] of byBuilder) {
        const warehouseNodeId = items[0]!.builder.warehouseNodeId;
        const estMinutes = items.reduce((sum, i) => sum + i.qty * 90, 0);
        await tx.buildQueue.create({
          data: {
            orderId: order.orderId,
            builderId,
            warehouseNodeId,
            status: 'queued',
            priority: 5,
            items: items.map((i) => ({ productId: i.productId, qty: i.qty, orderItemId: i.orderItemId })) as never,
            estimatedMinutes: estMinutes,
          },
        });
      }

      return order;
    });

    // Fire the order-created event (notifies builders, emails customer, etc.)
    await publishEvent('bav.orders.paid', {
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      userId,
      totalGbp: total,
    }).catch((err) => console.warn('[orders] event publish failed', err));

    return ok(
      {
        orderNumber: result.orderNumber,
        orderId: result.orderId,
        status: result.status,
        totalGbp: total,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
