import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  registered: 'Registered',
  moved: 'Moved',
  bound_to_build: 'Bound to build',
  unbound: 'Unbound',
  written_off: 'Written off',
  returned_to_stock: 'Returned to stock',
};

// Low-stock threshold heuristic — swapped for a real per-type threshold
// table once the workshop dials them in.
const LOW_STOCK_THRESHOLDS: Record<string, number> = {
  gpu: 8,
  cpu: 12,
  ram: 16,
  ssd: 15,
  hdd: 6,
  psu: 10,
  chassis: 12,
  mobo: 10,
  cooler: 10,
  fan: 24,
  cable: 20,
};
const DEFAULT_THRESHOLD = 8;

function pad(n: number, width = 2) {
  return n.toString().padStart(width, '0');
}

function formatWhen(iso: Date) {
  return iso.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminInventoryDashboard() {
  const [componentsInStock, unassignedQrCodes, scansToday, movements, types] =
    await Promise.all([
      prisma.component.count(),
      prisma.qrCode.count({ where: { componentId: null } }),
      prisma.inventoryMovement.count({
        where: {
          action: { in: ['registered', 'moved', 'bound_to_build'] },
          occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.inventoryMovement.findMany({
        take: 8,
        orderBy: { occurredAt: 'desc' },
        include: {
          component: { include: { type: true } },
          actor: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.componentType.findMany({
        include: { _count: { select: { components: true } } },
        orderBy: { label: 'asc' },
      }),
    ]);

  const lowStock = types
    .map((t) => {
      const threshold = LOW_STOCK_THRESHOLDS[t.code] ?? DEFAULT_THRESHOLD;
      const inStock = t._count.components;
      return {
        code: t.code,
        label: t.label,
        inStock,
        threshold,
        delta: inStock - threshold,
      };
    })
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta);

  const kpis = [
    {
      label: 'Components in stock',
      value: componentsInStock.toLocaleString(),
      href: '/admin/inventory/search',
    },
    {
      label: 'Low-stock alerts',
      value: pad(lowStock.length),
    },
    {
      label: 'Scans today',
      value: pad(scansToday),
    },
    {
      label: 'Unassigned QRs',
      value: pad(unassignedQrCodes, 4),
    },
  ];

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
              — Inventory
            </div>
            <h1
              className="m-0 font-display font-light"
              style={{
                fontSize: 'clamp(32px, 3.5vw, 48px)',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Components in the <span className="bav-italic">workshop</span>.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/inventory/qr-generate"
              className="bav-cta-secondary"
              style={{ width: 'auto', padding: '19px 36px', textDecoration: 'none' }}
            >
              Generate QR batch
            </Link>
            <Link
              href="/admin/inventory/import"
              className="bav-cta"
              style={{ width: 'auto', padding: '20px 36px', textDecoration: 'none' }}
            >
              Import components
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <section
          className="mb-[72px] grid border border-ink-10"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {kpis.map((kpi, i) => {
            const inner = (
              <>
                <div
                  className="bav-label"
                  style={{ color: 'var(--ink-60)', marginBottom: 20 }}
                >
                  {kpi.label}
                </div>
                <div
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {kpi.value}
                </div>
              </>
            );
            const classes =
              'min-w-0' + (i < 3 ? ' border-r border-ink-10' : '');
            return kpi.href ? (
              <Link
                key={kpi.label}
                href={kpi.href}
                className={`${classes} bav-hover-opa no-underline`}
                style={{ padding: '32px 28px', color: 'var(--ink)' }}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={kpi.label}
                className={classes}
                style={{ padding: '32px 28px' }}
              >
                {inner}
              </div>
            );
          })}
        </section>

        {/* Two-column split */}
        <div
          className="grid gap-[72px]"
          style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }}
        >
          {/* Recent movements */}
          <section>
            <div className="mb-7 flex items-baseline justify-between">
              <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — Recent movements
              </div>
              <Link
                href="/admin/inventory/search"
                className="bav-underline text-[12px] no-underline"
                style={{ color: 'var(--ink)' }}
              >
                All activity <span className="arrow">→</span>
              </Link>
            </div>

            <div>
              <div
                className="grid border-b border-ink-10"
                style={{
                  gridTemplateColumns: '1.5fr 2fr 1.4fr 1fr 1.2fr',
                  padding: '14px 0',
                }}
              >
                {['QR ID', 'Component', 'Action', 'Actor', 'When'].map((h) => (
                  <div
                    key={h}
                    className="bav-label"
                    style={{ color: 'var(--ink-30)' }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {movements.length === 0 && (
                <div className="py-8 text-[13px]" style={{ color: 'var(--ink-60)' }}>
                  No movements recorded yet.
                </div>
              )}

              {movements.map((m) => {
                const componentLabel = [
                  m.component.manufacturer,
                  m.component.model,
                ]
                  .filter(Boolean)
                  .join(' ') ||
                  m.component.type.label;
                const actorLabel = m.actor
                  ? m.actor.firstName ?? m.actor.email
                  : '—';
                return (
                  <Link
                    key={m.movementId}
                    href={`/admin/inventory/${m.qrId}`}
                    className="bav-hover-opa grid border-b border-ink-10 no-underline"
                    style={{
                      gridTemplateColumns: '1.5fr 2fr 1.4fr 1fr 1.2fr',
                      padding: '16px 0',
                      alignItems: 'center',
                      color: 'var(--ink)',
                    }}
                  >
                    <div className="font-mono tabular-nums" style={{ fontSize: 12 }}>
                      {m.qrId}
                    </div>
                    <div style={{ fontSize: 14 }}>{componentLabel}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>
                      {ACTION_LABEL[m.action] ?? m.action}
                    </div>
                    <div
                      className="font-mono tabular-nums"
                      style={{ fontSize: 12, color: 'var(--ink-60)' }}
                    >
                      {actorLabel}
                    </div>
                    <div
                      className="font-mono tabular-nums"
                      style={{ fontSize: 11, color: 'var(--ink-60)' }}
                    >
                      {formatWhen(m.occurredAt)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Low-stock alerts */}
          <section>
            <div className="mb-7 flex items-baseline justify-between">
              <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — Low-stock alerts
              </div>
              <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                {pad(lowStock.length)} types
              </span>
            </div>
            <div>
              <div
                className="grid border-b border-ink-10"
                style={{
                  gridTemplateColumns: '1.6fr 0.7fr 0.7fr 0.6fr',
                  padding: '14px 0',
                }}
              >
                {['Type', 'In stock', 'Threshold', 'Δ'].map((h) => (
                  <div
                    key={h}
                    className="bav-label"
                    style={{ color: 'var(--ink-30)' }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {lowStock.length === 0 && (
                <div className="py-8 text-[13px]" style={{ color: 'var(--ink-60)' }}>
                  All types above threshold.
                </div>
              )}
              {lowStock.map((row) => (
                <div
                  key={row.code}
                  className="grid border-b border-ink-10"
                  style={{
                    gridTemplateColumns: '1.6fr 0.7fr 0.7fr 0.6fr',
                    padding: '16px 0',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 14 }}>{row.label}</div>
                  <div className="font-mono tabular-nums" style={{ fontSize: 13 }}>
                    {pad(row.inStock)}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 13, color: 'var(--ink-60)' }}
                  >
                    {pad(row.threshold)}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 13, color: '#B98A40' }}
                  >
                    {row.delta}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <Link
                href="/admin/inventory/search?lowStock=1"
                className="bav-underline text-[12px] no-underline"
                style={{ color: 'var(--ink)' }}
              >
                Review flagged types <span className="arrow">→</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div
          className="mt-24 flex flex-wrap gap-8 border-t border-ink-10 pt-8"
        >
          <Link
            href="/admin/inventory/qr-generate"
            className="bav-underline text-[13px] no-underline"
            style={{ color: 'var(--ink)' }}
          >
            Generate QR batch <span className="arrow">→</span>
          </Link>
          <Link
            href="/admin/inventory/import"
            className="bav-underline text-[13px] no-underline"
            style={{ color: 'var(--ink)' }}
          >
            Import components <span className="arrow">→</span>
          </Link>
          <Link
            href="/admin/inventory/search"
            className="bav-underline text-[13px] no-underline"
            style={{ color: 'var(--ink)' }}
          >
            Search catalogue <span className="arrow">→</span>
          </Link>
          <Link
            href="/admin/inventory/export.csv"
            className="bav-underline text-[13px] no-underline"
            style={{ color: 'var(--ink)' }}
          >
            Bulk export (CSV) <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
