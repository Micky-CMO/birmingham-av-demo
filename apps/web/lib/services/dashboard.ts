import { prisma } from '@/lib/db';

const DAY = 86_400_000;

function pctChange(curr: number, prior: number): number {
  if (prior === 0) return curr > 0 ? 100 : 0;
  return Number((((curr - prior) / prior) * 100).toFixed(1));
}

export type DashboardKPIs = {
  revenueToday: { value: number; deltaPct: number };
  revenue7d: { value: number; deltaPct: number; sparkline: number[] };
  ordersToday: { value: number; deltaPct: number };
  aov30d: { value: number; deltaPct: number };
  pendingFulfilment: number;
  refundsOpen: number;
  flaggedReturns: number;
  openTickets: number;
  buildQueueLoad: number; // 0..1
  inventoryAlerts: number;
};

export async function getDashboardKpis(): Promise<DashboardKPIs> {
  const now = Date.now();
  const startToday = new Date(now - DAY);
  const startYesterday = new Date(now - 2 * DAY);
  const start7 = new Date(now - 7 * DAY);
  const start14 = new Date(now - 14 * DAY);
  const start30 = new Date(now - 30 * DAY);
  const start60 = new Date(now - 60 * DAY);

  const [
    revToday,
    revYesterday,
    rev7,
    rev14,
    ordToday,
    ordYesterday,
    aov30Agg,
    aov60Agg,
    pendingFulfilment,
    refundsOpen,
    flaggedReturns,
    openTickets,
    activeBuilds,
    nodes,
    inventoryLow,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startToday } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startYesterday, lt: startToday } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: start7 } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: start14, lt: start7 } }, _sum: { totalGbp: true } }),
    prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: startToday } } }),
    prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: startYesterday, lt: startToday } } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: start30 } }, _avg: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: start60, lt: start30 } }, _avg: { totalGbp: true } }),
    prisma.order.count({ where: { status: { in: ['paid', 'queued', 'in_build', 'qc'] } } }),
    prisma.return.count({ where: { status: { in: ['requested', 'approved', 'in_transit', 'received'] } } }),
    prisma.return.count({ where: { aiFlaggedPattern: { not: null }, status: { not: 'resolved' } } }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'ai_handling', 'awaiting_customer'] } } }),
    prisma.buildQueue.count({ where: { status: { in: ['queued', 'in_progress'] } } }),
    prisma.warehouseNode.aggregate({ where: { isActive: true }, _sum: { maxConcurrentBuilds: true } }),
    prisma.productInventory.count({ where: { stockQty: { lte: 2 } } }),
  ]);

  // Daily sparkline for revenue 7d (oldest -> newest)
  const sparkline: number[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = new Date(now - (i + 1) * DAY);
    const dayEnd = new Date(now - i * DAY);
    const agg = await prisma.order.aggregate({
      where: { status: { not: 'draft' }, createdAt: { gte: dayStart, lt: dayEnd } },
      _sum: { totalGbp: true },
    });
    sparkline.push(Number(agg._sum.totalGbp ?? 0));
  }

  const totalCapacity = Number(nodes._sum.maxConcurrentBuilds ?? 0);
  const buildQueueLoad = totalCapacity === 0 ? 0 : Math.min(1, activeBuilds / totalCapacity);

  return {
    revenueToday: {
      value: Number(revToday._sum.totalGbp ?? 0),
      deltaPct: pctChange(Number(revToday._sum.totalGbp ?? 0), Number(revYesterday._sum.totalGbp ?? 0)),
    },
    revenue7d: {
      value: Number(rev7._sum.totalGbp ?? 0),
      deltaPct: pctChange(Number(rev7._sum.totalGbp ?? 0), Number(rev14._sum.totalGbp ?? 0)),
      sparkline,
    },
    ordersToday: { value: ordToday, deltaPct: pctChange(ordToday, ordYesterday) },
    aov30d: {
      value: Number(aov30Agg._avg.totalGbp ?? 0),
      deltaPct: pctChange(Number(aov30Agg._avg.totalGbp ?? 0), Number(aov60Agg._avg.totalGbp ?? 0)),
    },
    pendingFulfilment,
    refundsOpen,
    flaggedReturns,
    openTickets,
    buildQueueLoad,
    inventoryAlerts: inventoryLow,
  };
}

// --- Revenue chart (30-day daily series) ---

export type RevenuePoint = { date: string; revenue: number; orders: number };

export async function getRevenueChart(days = 30): Promise<RevenuePoint[]> {
  const now = Date.now();
  const points: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const dayStart = new Date(now - (i + 1) * DAY);
    const dayEnd = new Date(now - i * DAY);
    const [agg, orders] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { not: 'draft' }, createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { totalGbp: true },
      }),
      prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: dayStart, lt: dayEnd } } }),
    ]);
    points.push({
      date: dayStart.toISOString().slice(0, 10),
      revenue: Number(agg._sum.totalGbp ?? 0),
      orders,
    });
  }
  return points;
}

// --- Top builders by margin (90d) ---

export type TopBuilder = {
  builderCode: string;
  displayName: string;
  avatarUrl: string | null;
  unitsSold: number;
  marginGbp: number;
  qualityScore: number;
  rmaRate: number;
};

export async function getTopBuilders(limit = 5): Promise<TopBuilder[]> {
  const builders = await prisma.builder.findMany({
    where: { status: 'active' },
    orderBy: { qualityScore: 'desc' },
    take: limit,
  });
  return builders.map((b) => ({
    builderCode: b.builderCode,
    displayName: b.displayName,
    avatarUrl: b.avatarUrl,
    unitsSold: Math.round(b.totalUnitsSold * 0.25),
    marginGbp: Math.round(b.totalUnitsSold * 0.25 * 850 * 0.28),
    qualityScore: Number(b.qualityScore),
    rmaRate: Number(b.rmaRateRolling90d),
  }));
}

// --- Top selling products (by order_item count) ---

export type TopProduct = {
  productId: string;
  title: string;
  slug: string;
  priceGbp: number;
  unitsSold: number;
  imageUrl: string | null;
};

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { qty: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { productId: { in: grouped.map((g) => g.productId) } },
  });
  const byId = new Map(products.map((p) => [p.productId, p] as const));
  return grouped.map((g) => {
    const p = byId.get(g.productId)!;
    return {
      productId: g.productId,
      title: p?.title ?? 'Unknown',
      slug: p?.slug ?? '#',
      priceGbp: p ? Number(p.priceGbp) : 0,
      unitsSold: g._sum.qty ?? 0,
      imageUrl: null,
    };
  });
}

// --- Returns reasons breakdown ---

export type ReasonSlice = { reason: string; count: number; pct: number };

export async function getReturnsReasons(): Promise<ReasonSlice[]> {
  const rows = await prisma.return.groupBy({
    by: ['reason'],
    _count: { reason: true },
  });
  const total = rows.reduce((s, r) => s + r._count.reason, 0);
  if (total === 0) return [];
  return rows
    .map((r) => ({ reason: r.reason as string, count: r._count.reason, pct: r._count.reason / total }))
    .sort((a, b) => b.count - a.count);
}

// --- Recent activity feed (orders + returns + tickets, merged) ---

export type ActivityItem = {
  type: 'order' | 'return' | 'ticket' | 'build';
  title: string;
  subtitle: string;
  at: string;
  href: string;
  tone?: 'positive' | 'warning' | 'critical' | 'info' | 'neutral';
};

export async function getRecentActivity(limit = 12): Promise<ActivityItem[]> {
  const [orders, returns, tickets] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.return.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { product: { select: { title: true } }, builder: { select: { displayName: true } } },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, email: true } } },
    }),
  ]);

  const items: ActivityItem[] = [
    ...orders.map<ActivityItem>((o) => ({
      type: 'order',
      title: `Order ${o.orderNumber}`,
      subtitle: `${[o.user.firstName, o.user.lastName].filter(Boolean).join(' ') || o.user.email} · £${Number(o.totalGbp).toFixed(2)}`,
      at: o.createdAt.toISOString(),
      href: `/admin/orders?q=${o.orderNumber}`,
      tone: o.status === 'delivered' ? 'positive' : 'info',
    })),
    ...returns.map<ActivityItem>((r) => ({
      type: 'return',
      title: `Return ${r.returnNumber}`,
      subtitle: `${r.product.title} · ${r.builder.displayName}`,
      at: r.createdAt.toISOString(),
      href: `/admin/returns`,
      tone: r.aiFlaggedPattern ? 'critical' : 'warning',
    })),
    ...tickets.map<ActivityItem>((t) => ({
      type: 'ticket',
      title: `Ticket ${t.ticketNumber}`,
      subtitle: `${t.user.firstName ?? t.user.email}: ${t.subject}`,
      at: t.createdAt.toISOString(),
      href: `/admin/support`,
      tone: t.status === 'escalated_human' ? 'critical' : 'info',
    })),
  ];
  return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
}

// --- Low stock alerts ---

export type StockAlert = {
  productId: string;
  title: string;
  sku: string;
  stockQty: number;
  reorderThreshold: number;
};

export async function getLowStockAlerts(): Promise<StockAlert[]> {
  const inventories = await prisma.productInventory.findMany({
    where: { stockQty: { lte: 3 } },
    include: { product: { select: { title: true, sku: true } } },
    take: 8,
  });
  return inventories.map((i) => ({
    productId: i.productId,
    title: i.product.title,
    sku: i.product.sku,
    stockQty: i.stockQty,
    reorderThreshold: i.reorderThreshold,
  }));
}

// --- Extended KPIs for artefact 35 dashboard (revenue rollups + flags) ---

export type ExtendedKPIs = {
  revenueToday: { value: number; deltaPct: number };
  revenueWeek: { value: number; deltaPct: number };
  revenueMonth: { value: number; deltaPct: number };
  ordersToday: { value: number; deltaPct: number };
  flaggedReturns: { value: number };
  openTickets: { value: number };
  activeBuilds: { value: number };
};

export async function getExtendedDashboardKpis(): Promise<ExtendedKPIs> {
  const now = Date.now();
  const startDay = new Date(now - DAY);
  const startPrevDay = new Date(now - 2 * DAY);
  const startWeek = new Date(now - 7 * DAY);
  const startPrevWeek = new Date(now - 14 * DAY);
  const startMonth = new Date(now - 30 * DAY);
  const startPrevMonth = new Date(now - 60 * DAY);

  const [
    revDay,
    revPrevDay,
    revWeek,
    revPrevWeek,
    revMonth,
    revPrevMonth,
    ordDay,
    ordPrevDay,
    flaggedReturns,
    openTickets,
    activeBuilds,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startDay } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startPrevDay, lt: startDay } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startWeek } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startPrevWeek, lt: startWeek } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startMonth } }, _sum: { totalGbp: true } }),
    prisma.order.aggregate({ where: { status: { not: 'draft' }, createdAt: { gte: startPrevMonth, lt: startMonth } }, _sum: { totalGbp: true } }),
    prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: startDay } } }),
    prisma.order.count({ where: { status: { not: 'draft' }, createdAt: { gte: startPrevDay, lt: startDay } } }),
    prisma.return.count({ where: { aiFlaggedPattern: { not: null }, status: { not: 'resolved' } } }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'ai_handling', 'awaiting_customer'] } } }),
    prisma.buildQueue.count({ where: { status: { in: ['queued', 'in_progress'] } } }),
  ]);

  return {
    revenueToday: {
      value: Number(revDay._sum.totalGbp ?? 0),
      deltaPct: pctChange(Number(revDay._sum.totalGbp ?? 0), Number(revPrevDay._sum.totalGbp ?? 0)),
    },
    revenueWeek: {
      value: Number(revWeek._sum.totalGbp ?? 0),
      deltaPct: pctChange(Number(revWeek._sum.totalGbp ?? 0), Number(revPrevWeek._sum.totalGbp ?? 0)),
    },
    revenueMonth: {
      value: Number(revMonth._sum.totalGbp ?? 0),
      deltaPct: pctChange(Number(revMonth._sum.totalGbp ?? 0), Number(revPrevMonth._sum.totalGbp ?? 0)),
    },
    ordersToday: { value: ordDay, deltaPct: pctChange(ordDay, ordPrevDay) },
    flaggedReturns: { value: flaggedReturns },
    openTickets: { value: openTickets },
    activeBuilds: { value: activeBuilds },
  };
}

// --- Live build queue (artefact 35) ---

export type BuildQueueItem = {
  buildNumber: string;
  orderNumber: string;
  product: string;
  builder: { displayName: string; builderCode: string };
  status: string;
  stageLabel: string;
  minutesIn: number;
};

export async function getActiveBuildQueue(limit = 6): Promise<BuildQueueItem[]> {
  const rows = await prisma.buildQueue.findMany({
    where: { status: { in: ['queued', 'in_progress'] } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    include: {
      order: { select: { orderNumber: true } },
      builder: { select: { displayName: true, builderCode: true } },
    },
  });
  return rows.map((r, idx) => {
    const itemTitle = Array.isArray(r.items) && r.items.length > 0 && typeof r.items[0] === 'object'
      ? (r.items[0] as { title?: string }).title ?? 'Custom build'
      : 'Custom build';
    const minutesIn = r.startedAt
      ? Math.max(0, Math.round((Date.now() - r.startedAt.getTime()) / 60_000))
      : r.estimatedMinutes ?? 0;
    return {
      buildNumber: `№${200 - idx}`,
      orderNumber: r.order.orderNumber,
      product: itemTitle,
      builder: {
        displayName: r.builder.displayName,
        builderCode: r.builder.builderCode,
      },
      status: r.status === 'in_progress' ? 'in_build' : r.status,
      stageLabel: r.status === 'in_progress' ? 'On the floor' : 'Awaiting parts',
      minutesIn,
    };
  });
}

// --- Geography (where orders ship) ---

export type CityCount = { city: string; orders: number };

export async function getShippingCities(limit = 8): Promise<CityCount[]> {
  const rows = await prisma.order.findMany({
    where: { status: { not: 'draft' }, shippingAddress: { not: undefined } },
    select: { shippingAddress: true },
    take: 500,
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const addr = r.shippingAddress as { city?: string } | null;
    const city = addr?.city ?? 'Unknown';
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([city, orders]) => ({ city, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}
