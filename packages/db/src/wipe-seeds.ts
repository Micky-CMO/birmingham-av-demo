import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
import { prisma } from './prisma';

async function main() {
  const seeds = await prisma.product.findMany({
    where: { sku: { startsWith: 'BAV-DEMO-' } },
    select: { productId: true },
  });
  console.log(`Seed products found: ${seeds.length}`);
  if (seeds.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const ids = seeds.map((s) => s.productId);

  // Collect orderItemIds for seed products — Returns can reference OrderItem.id,
  // not just Product.id, so we need to delete those returns before order items.
  const orderItemRows = await prisma.orderItem.findMany({
    where: { productId: { in: ids } },
    select: { orderItemId: true },
  });
  const orderItemIds = orderItemRows.map((r) => r.orderItemId);

  const counts = {
    orderItems: orderItemIds.length,
    reviews: await prisma.review.count({ where: { productId: { in: ids } } }),
    returnsByProduct: await prisma.return.count({ where: { productId: { in: ids } } }),
    returnsByOrderItem: orderItemIds.length
      ? await prisma.return.count({ where: { orderItemId: { in: orderItemIds } } })
      : 0,
    units: await prisma.unit.count({ where: { productId: { in: ids } } }),
    inventory: await prisma.productInventory.count({ where: { productId: { in: ids } } }),
    supportTickets: await prisma.supportTicket.count({ where: { productId: { in: ids } } }),
    avCareClaims: await prisma.avCareClaim.count({ where: { productId: { in: ids } } }),
  };
  console.log('Dependents:', counts);

  await prisma.$transaction([
    prisma.avCareClaim.deleteMany({ where: { productId: { in: ids } } }),
    prisma.review.deleteMany({ where: { productId: { in: ids } } }),
    prisma.supportTicket.updateMany({ where: { productId: { in: ids } }, data: { productId: null } }),
    // Returns first — they FK to OrderItem
    prisma.return.deleteMany({ where: { productId: { in: ids } } }),
    ...(orderItemIds.length
      ? [prisma.return.deleteMany({ where: { orderItemId: { in: orderItemIds } } })]
      : []),
    prisma.orderItem.deleteMany({ where: { productId: { in: ids } } }),
    prisma.unit.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productInventory.deleteMany({ where: { productId: { in: ids } } }),
    prisma.product.deleteMany({ where: { productId: { in: ids } } }),
  ]);

  const remaining = await prisma.product.count();
  console.log(`Wiped ${seeds.length} seed products. ${remaining} products remain.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
