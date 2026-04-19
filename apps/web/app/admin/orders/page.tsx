import { prisma } from '@/lib/db';
import { OrdersTable, type AdminOrder } from '@/components/admin/OrdersTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders · Admin' };

export default async function AdminOrdersPage() {
  const [rows, totalCount, builders] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: {
          include: {
            builder: { select: { builderCode: true, displayName: true } },
          },
        },
      },
    }),
    prisma.order.count({ where: { status: { not: 'draft' } } }),
    prisma.builder.findMany({
      where: { status: 'active' },
      orderBy: { builderCode: 'asc' },
      select: { builderCode: true, displayName: true },
    }),
  ]);

  const orders: AdminOrder[] = rows.map((o) => {
    const firstItem = o.items[0];
    const builderCode = firstItem?.builder?.builderCode ?? null;
    return {
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      customerName:
        [o.user.firstName, o.user.lastName].filter(Boolean).join(' ') || o.user.email,
      customerEmail: o.user.email,
      itemsCount: o.items.length,
      totalGbp: Number(o.totalGbp),
      status: o.status,
      paymentMethod: o.paymentMethod ?? null,
      builderCode,
    };
  });

  const builderOptions = builders.map((b) => ({ code: b.builderCode, name: b.displayName }));

  return <OrdersTable orders={orders} totalCount={totalCount} builderOptions={builderOptions} />;
}
