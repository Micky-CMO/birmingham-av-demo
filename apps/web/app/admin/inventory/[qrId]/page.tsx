import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ActionRail } from './ActionRail';

export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  registered: 'Registered',
  moved: 'Moved',
  bound_to_build: 'Bound to build',
  unbound: 'Unbound',
  written_off: 'Written off',
  returned_to_stock: 'Returned to stock',
};

type StockStatus =
  | 'in_stock'
  | 'at_workbench'
  | 'bound'
  | 'dispatched'
  | 'written_off';

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; dot: string; note: string }
> = {
  in_stock: {
    label: 'In stock',
    dot: 'var(--accent)',
    note: 'Available for assignment.',
  },
  at_workbench: {
    label: 'At workbench',
    dot: '#B98A40',
    note: 'Pulled for an active build. Not available.',
  },
  bound: {
    label: 'Bound',
    dot: 'var(--ink-30)',
    note: 'Assigned to a unit under construction.',
  },
  dispatched: {
    label: 'Dispatched',
    dot: 'var(--ink-30)',
    note: 'Shipped with an order. No longer in stock.',
  },
  written_off: {
    label: 'Written off',
    dot: '#B94040',
    note: 'Removed from stock. Not recoverable.',
  },
};

function formatWhen(iso: Date) {
  return iso.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deriveStockStatus(
  component: {
    currentLocation: string | null;
    boundToUnitId: string | null;
  },
  movements: { action: string }[],
): StockStatus {
  if (movements.some((m) => m.action === 'written_off')) return 'written_off';
  if (component.boundToUnitId) return 'bound';
  const loc = component.currentLocation?.toLowerCase() ?? '';
  if (loc.startsWith('workbench') || loc.includes('bench')) return 'at_workbench';
  return 'in_stock';
}

export default async function AdminInventoryComponentDetailPage({
  params,
}: {
  params: { qrId: string };
}) {
  const qrId = decodeURIComponent(params.qrId);

  const qr = await prisma.qrCode.findUnique({
    where: { qrId },
    include: {
      component: {
        include: {
          type: true,
          qrCodes: true,
          movements: {
            orderBy: { occurredAt: 'desc' },
            include: {
              actor: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
          boundToUnit: true,
        },
      },
    },
  });

  if (!qr) notFound();
  const component = qr.component;
  if (!component) {
    // QR exists but is unclaimed — bounce to register.
    return (
      <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
            — Unclaimed sticker
          </div>
          <h1
            className="m-0 font-display font-light"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontVariationSettings: "'opsz' 144",
              marginBottom: 16,
            }}
          >
            Nothing bound to{' '}
            <span className="bav-italic">{qr.qrId}</span> yet.
          </h1>
          <Link
            href={`/admin/inventory/register/${encodeURIComponent(qr.qrId)}`}
            className="bav-cta no-underline"
            style={{ width: 'auto', padding: '20px 36px' }}
          >
            Register component
          </Link>
        </div>
      </main>
    );
  }

  const stockStatus = deriveStockStatus(
    { currentLocation: component.currentLocation, boundToUnitId: component.boundToUnitId },
    component.movements,
  );
  const status = STATUS_CONFIG[stockStatus];

  const modelParts = (component.model ?? '').split(' ');
  const headFirst = modelParts[0] ?? '';
  const headRest = modelParts.slice(1).join(' ');

  const specs: Array<[string, string]> = [
    ['Type', component.type.label],
    ['Manufacturer', component.manufacturer ?? '—'],
    ['Model', component.model ?? '—'],
    ['Serial number', component.serialNumber ?? '—'],
    ['Condition', component.conditionGrade ?? '—'],
    [
      'Cost',
      component.costGbp != null
        ? `£${Number(component.costGbp).toFixed(2)}`
        : '—',
    ],
    ['Supplier', component.supplier ?? '—'],
    ['Received', formatWhen(component.receivedAt)],
    ['Current location', component.currentLocation ?? '—'],
    ['Bound to build', component.boundToUnitId ?? '—'],
  ];

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        {/* Breadcrumb */}
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          <Link
            href="/admin/inventory"
            className="bav-hover-opa no-underline"
            style={{ color: 'inherit' }}
          >
            Inventory
          </Link>
          <span className="mx-2.5" style={{ color: 'var(--ink-30)' }}>
            /
          </span>
          <Link
            href="/admin/inventory/search"
            className="bav-hover-opa no-underline"
            style={{ color: 'inherit' }}
          >
            Components
          </Link>
          <span className="mx-2.5" style={{ color: 'var(--ink-30)' }}>
            /
          </span>
          <span>{qr.qrId}</span>
        </div>

        {/* Title */}
        <div className="mb-16">
          <div
            className="mb-3 font-mono tabular-nums"
            style={{ fontSize: 13, color: 'var(--ink-60)' }}
          >
            {qr.qrId}
          </div>
          <h1
            className="m-0 font-display font-light"
            style={{
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              fontVariationSettings: "'opsz' 144",
              lineHeight: 1.1,
            }}
          >
            {component.manufacturer}{' '}
            {headFirst && <span className="bav-italic">{headFirst}</span>}{' '}
            {headRest}
          </h1>
        </div>

        <div
          className="grid gap-[72px]"
          style={{
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            alignItems: 'flex-start',
          }}
        >
          {/* Left column */}
          <div>
            {/* Specs */}
            <section className="mb-[72px]">
              <div
                className="bav-label mb-7"
                style={{ color: 'var(--ink-60)' }}
              >
                — Specification
              </div>
              <div>
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="grid border-t border-ink-10 last:border-b"
                    style={{
                      gridTemplateColumns: '1fr 2fr',
                      gap: 16,
                      padding: '18px 0',
                    }}
                  >
                    <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      {k}
                    </div>
                    <div
                      className="font-mono tabular-nums"
                      style={{ fontSize: 14 }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Movement history */}
            <section>
              <div className="mb-7 flex items-baseline justify-between">
                <div
                  className="bav-label"
                  style={{ color: 'var(--ink-60)' }}
                >
                  — Movement history
                </div>
                <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                  {component.movements.length.toString().padStart(2, '0')} events
                </span>
              </div>

              <div>
                <div
                  className="grid border-b border-ink-10"
                  style={{
                    gridTemplateColumns: '1.2fr 1.6fr 1.4fr 1.2fr',
                    padding: '14px 0',
                  }}
                >
                  {['Action', 'Location', 'Actor', 'When'].map((h) => (
                    <div
                      key={h}
                      className="bav-label"
                      style={{ color: 'var(--ink-30)' }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {component.movements.map((m) => {
                  const actorLabel = m.actor
                    ? m.actor.firstName ?? m.actor.email
                    : '—';
                  return (
                    <div
                      key={m.movementId}
                      className="grid border-b border-ink-10"
                      style={{
                        gridTemplateColumns: '1.2fr 1.6fr 1.4fr 1.2fr',
                        padding: '18px 0',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13 }}>
                        {ACTION_LABEL[m.action] ?? m.action}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>
                        {m.fromLocation && m.toLocation ? (
                          <>
                            <span style={{ color: 'var(--ink-30)' }}>
                              {m.fromLocation}
                            </span>{' '}
                            → {m.toLocation}
                          </>
                        ) : (
                          m.toLocation || m.fromLocation || '—'
                        )}
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
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right rail */}
          <aside className="sticky top-[96px]">
            <div
              className="bav-canvas mb-5"
              style={{ border: '1px solid var(--ink-10)', padding: '28px' }}
            >
              <div className="mb-3.5 flex items-center gap-2.5">
                {stockStatus === 'in_stock' ? (
                  <span className="bav-pulse" aria-hidden />
                ) : (
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: status.dot,
                    }}
                  />
                )}
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  — Status
                </span>
              </div>
              <div
                className="mb-2 font-display font-light"
                style={{
                  fontSize: 24,
                  fontVariationSettings: "'opsz' 144",
                }}
              >
                {status.label}.
              </div>
              <div
                className="text-[13px]"
                style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}
              >
                {status.note}
              </div>
            </div>

            <ActionRail
              qrId={qr.qrId}
              currentLocation={component.currentLocation}
              isBound={Boolean(component.boundToUnitId)}
            />

            {/* Meta block */}
            <div
              className="mt-9 border-t border-ink-10 pt-6"
            >
              <div
                className="bav-label mb-4"
                style={{ color: 'var(--ink-60)' }}
              >
                — Record
              </div>
              <div
                className="flex justify-between border-b border-ink-10"
                style={{ padding: '10px 0' }}
              >
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  Component ID
                </span>
                <span className="font-mono tabular-nums" style={{ fontSize: 11 }}>
                  {component.componentId.slice(0, 14)}…
                </span>
              </div>
              <div
                className="flex justify-between border-b border-ink-10"
                style={{ padding: '10px 0' }}
              >
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  QR ID
                </span>
                <span className="font-mono tabular-nums" style={{ fontSize: 12 }}>
                  {qr.qrId}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
