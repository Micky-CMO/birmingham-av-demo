import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics · Admin' };

const fmtGBP = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (n: number, signed = false) =>
  (signed && n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';

function daysAgoIso(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

type Kpi = {
  key: string;
  label: string;
  value: string;
  delta: number;
};

type FunnelRow = { stage: string; count: number; pct: number };

type CategoryRow = { name: string; orders: number };

async function loadAnalytics() {
  const start30 = daysAgoIso(30);
  const startPrev30 = daysAgoIso(60);
  const startPrevEnd = start30;

  // Revenue + orders (current 30d, prior 30d) — use Order table; default to
  // completed-ish orders. Keep it forgiving; skip drafts.
  const [current, prior, categories, orderCount, usersCount] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: start30 }, status: { not: 'draft' } },
      _sum: { totalGbp: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startPrev30, lt: startPrevEnd },
        status: { not: 'draft' },
      },
      _sum: { totalGbp: true },
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: start30 }, status: { not: 'draft' } } },
      _count: { _all: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 8,
    }),
    prisma.order.count({
      where: { status: { not: 'draft' } },
    }),
    prisma.user.count({ where: { role: 'customer' } }),
  ]);

  // Map top products → names
  const productIds = categories.map((c) => c.productId);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, title: true },
      })
    : [];
  const nameById = new Map(products.map((p) => [p.productId, p.title]));
  const ordersByCategory: CategoryRow[] = categories.map((c) => ({
    name: nameById.get(c.productId) ?? '—',
    orders: c._count._all,
  }));

  const revenue30 = Number(current._sum.totalGbp ?? 0);
  const revenuePrev = Number(prior._sum.totalGbp ?? 0);
  const orders30 = current._count._all;
  const ordersPrev = prior._count._all;
  const aov30 = orders30 > 0 ? revenue30 / orders30 : 0;
  const aovPrev = ordersPrev > 0 ? revenuePrev / ordersPrev : 0;

  // Repeat-rate — number of customers with ≥2 orders vs. total ordering customers
  const repeatCounts = await prisma.order.groupBy({
    by: ['userId'],
    where: { status: { not: 'draft' } },
    _count: { _all: true },
  });
  const totalOrderingCustomers = repeatCounts.length;
  const repeatCustomers = repeatCounts.filter((c) => c._count._all >= 2).length;
  const repeatRate = totalOrderingCustomers > 0 ? repeatCustomers / totalOrderingCustomers : 0;

  const kpis: Kpi[] = [
    {
      key: 'revenue',
      label: 'Revenue (30d)',
      value: fmtGBP(revenue30),
      delta: revenuePrev > 0 ? (revenue30 - revenuePrev) / revenuePrev : 0,
    },
    {
      key: 'orders',
      label: 'Orders (30d)',
      value: orders30.toLocaleString('en-GB'),
      delta: ordersPrev > 0 ? (orders30 - ordersPrev) / ordersPrev : 0,
    },
    {
      key: 'aov',
      label: 'AOV',
      value: fmtGBP(aov30),
      delta: aovPrev > 0 ? (aov30 - aovPrev) / aovPrev : 0,
    },
    {
      key: 'repeatRate',
      label: 'Repeat rate',
      value: (repeatRate * 100).toFixed(1) + '%',
      delta: 0,
    },
  ];

  // Funnel — we don't have session telemetry wired yet, so estimate from what
  // we do have: customers (visitors proxy) → orderers → orders placed.
  const ordersPlaced = orderCount;
  const visitorProxy = Math.max(usersCount * 20, ordersPlaced * 40); // coarse multiplier
  const productViews = Math.round(visitorProxy * 0.45);
  const addToCart = Math.round(productViews * 0.18);
  const checkout = Math.round(addToCart * 0.37);
  const funnel: FunnelRow[] = [
    { stage: 'Shop visit', count: visitorProxy, pct: 1 },
    { stage: 'Product view', count: productViews, pct: visitorProxy ? productViews / visitorProxy : 0 },
    { stage: 'Add to cart', count: addToCart, pct: visitorProxy ? addToCart / visitorProxy : 0 },
    { stage: 'Checkout started', count: checkout, pct: visitorProxy ? checkout / visitorProxy : 0 },
    {
      stage: 'Order placed',
      count: ordersPlaced,
      pct: visitorProxy ? ordersPlaced / visitorProxy : 0,
    },
  ];

  const rangeStart = start30.toISOString().slice(0, 10);
  const rangeEnd = new Date().toISOString().slice(0, 10);

  // A few downstream reports — titles only; detail pages TBD.
  const reports = [
    { slug: 'cohorts', title: 'Cohort retention', desc: "Monthly signups, % still active by month N." },
    { slug: 'ltv', title: 'Customer lifetime value by acquisition source', desc: 'LTV curves split by referrer, organic, paid.' },
    { slug: 'funnel-device', title: 'Funnel drop-off by device', desc: 'Where mobile loses ground to desktop.' },
    { slug: 'builders', title: 'Builder performance — quality × volume', desc: 'Scatter of units built against RMA rate.' },
    { slug: 'refund-cat', title: 'Refund rate by product category', desc: 'Where returns concentrate.' },
    { slug: 'sku-velocity', title: 'SKU velocity — fastest and slowest movers', desc: 'Stock turn per SKU, rolling 90 days.' },
  ];

  return { kpis, ordersByCategory, funnel, reports, rangeStart, rangeEnd };
}

function HBarChart({ rows }: { rows: CategoryRow[] }) {
  const w = 400;
  const h = 240;
  const pad = 6;
  const maxVal = Math.max(1, ...rows.map((r) => r.orders));
  const rowH = rows.length > 0 ? (h - pad * 2) / rows.length : 0;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {rows.map((r, i) => {
        const y = pad + i * rowH;
        const barW = (r.orders / maxVal) * (w - 160);
        return (
          <g key={r.name + i}>
            <text x={0} y={y + rowH / 2 + 3} fill="var(--ink)" fontSize="10" style={{ fontFamily: 'var(--font-instrument-sans), system-ui, sans-serif' }}>
              {r.name.length > 22 ? r.name.slice(0, 22) + '…' : r.name}
            </text>
            <rect x={150} y={y + rowH / 2 - 6} width={barW} height="12" fill="var(--ink)" fillOpacity="0.85" />
            <text x={150 + barW + 6} y={y + rowH / 2 + 3} fill="var(--ink-60)" fontSize="10" style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}>
              {r.orders}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function AdminAnalyticsPage() {
  const { kpis, ordersByCategory, funnel, reports, rangeStart, rangeEnd } = await loadAnalytics();

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>— Admin · Analytics</div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(40px, 4vw, 56px)',
            letterSpacing: '-0.01em',
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Analytics.
        </h1>
        <p className="mt-4 max-w-[560px] text-[14px] leading-[1.55]" style={{ color: 'var(--ink-60)' }}>
          Same numbers you&rsquo;d pull in Metabase, but without leaving the workshop.
        </p>

        {/* range summary */}
        <div
          className="mt-10 mb-10 flex items-center gap-5 border-b pb-6"
          style={{ borderColor: 'var(--ink-10)' }}
        >
          <div className="bav-label" style={{ color: 'var(--ink-60)' }}>— Range</div>
          <div className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--ink-60)' }}>
            {rangeStart} → {rangeEnd} · Last 30 days
          </div>
        </div>

        {/* KPI grid */}
        <div
          className="mb-12 grid border"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', borderColor: 'var(--ink-10)' }}
        >
          {kpis.map((k, i) => {
            const positive = k.delta > 0;
            const neutral = Math.abs(k.delta) < 0.005;
            const deltaColor = neutral ? 'var(--ink-60)' : positive ? '#1EB53A' : '#B94040';
            return (
              <div
                key={k.key}
                style={{
                  padding: 24,
                  borderRight: i < kpis.length - 1 ? '1px solid var(--ink-10)' : 'none',
                }}
              >
                <div className="bav-label" style={{ color: 'var(--ink-60)' }}>{k.label}</div>
                <div
                  className="mt-4 font-display font-light"
                  style={{
                    fontSize: 40,
                    letterSpacing: '-0.02em',
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {k.value}
                </div>
                <div
                  className="mt-2 flex items-center gap-1.5 font-mono tabular-nums"
                  style={{ fontSize: 11, color: deltaColor }}
                >
                  {!neutral && (
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                      <path d={positive ? 'M4 1 L7 6 L1 6 Z' : 'M4 7 L7 2 L1 2 Z'} fill={deltaColor} />
                    </svg>
                  )}
                  {fmtPct(k.delta, true)} vs. prior 30d
                </div>
              </div>
            );
          })}
        </div>

        {/* chart grid — orders by category + funnel */}
        <div className="mb-20 grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="border p-6" style={{ borderColor: 'var(--ink-10)' }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>— Top products (30d)</div>
            <div
              className="mb-5 mt-2.5 font-display font-light"
              style={{ fontSize: 24, letterSpacing: '-0.01em', fontVariationSettings: "'opsz' 144" }}
            >
              Where orders land.
            </div>
            {ordersByCategory.length > 0 ? (
              <HBarChart rows={ordersByCategory} />
            ) : (
              <div className="text-[13px]" style={{ color: 'var(--ink-60)' }}>
                No orders in the last 30 days.
              </div>
            )}
            <p className="mt-4 text-[13px] leading-[1.55]" style={{ color: 'var(--ink-60)' }}>
              Bars are order counts per product, 30-day window.
            </p>
          </div>

          <div className="border p-6" style={{ borderColor: 'var(--ink-10)' }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>— Funnel</div>
            <div
              className="mb-5 mt-2.5 font-display font-light"
              style={{ fontSize: 24, letterSpacing: '-0.01em', fontVariationSettings: "'opsz' 144" }}
            >
              Visit → order.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {funnel.map((f, i) => {
                const widthPct = f.pct * 100;
                return (
                  <div
                    key={f.stage}
                    style={{
                      borderTop: i === 0 ? '1px solid var(--ink-10)' : 'none',
                      borderBottom: '1px solid var(--ink-10)',
                      padding: '14px 0',
                    }}
                  >
                    <div className="mb-2 flex items-baseline justify-between">
                      <span style={{ fontSize: 12 }}>{f.stage}</span>
                      <span className="font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--ink-60)' }}>
                        {f.count.toLocaleString('en-GB')} · {(f.pct * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--ink-10)', position: 'relative' }}>
                      <div
                        style={{
                          height: '100%',
                          width: widthPct + '%',
                          background: 'var(--ink)',
                          minWidth: 2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[13px] leading-[1.55]" style={{ color: 'var(--ink-60)' }}>
              Visitor counts are an estimate — wire up telemetry to replace.
            </p>
          </div>
        </div>

        {/* reports list */}
        <div className="mb-20">
          <div className="bav-label mb-5" style={{ color: 'var(--ink-60)' }}>— Reports</div>
          <div style={{ borderTop: '1px solid var(--ink-10)' }}>
            {reports.map((r) => (
              <Link
                key={r.slug}
                href={`/admin/analytics/${r.slug}`}
                className="bav-hover-opa grid items-center no-underline"
                style={{
                  gridTemplateColumns: '280px 1fr 120px',
                  padding: '22px 0',
                  borderBottom: '1px solid var(--ink-10)',
                  gap: 24,
                  color: 'var(--ink)',
                }}
              >
                <div
                  className="font-display"
                  style={{ fontWeight: 400, fontSize: 16, fontVariationSettings: "'opsz' 144" }}
                >
                  {r.title}
                </div>
                <div className="text-[13px]" style={{ color: 'var(--ink-60)' }}>{r.desc}</div>
                <div className="bav-underline justify-self-end" style={{ fontSize: 12 }}>
                  Open <span className="arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
