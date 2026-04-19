import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  getExtendedDashboardKpis,
  getActiveBuildQueue,
  getRecentActivity,
} from '@/lib/services/dashboard';
import { DashboardRangeToggle } from '@/components/admin/DashboardRangeToggle';

export const dynamic = 'force-dynamic';

// Format helpers — shared by the tiles + activity row.
const fmtGbp = (n: number) =>
  `£${n.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmtDelta = (d: number | null | undefined) => {
  if (d === null || d === undefined) return null;
  if (d === 0) return '±0.0%';
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
};
const fmtMinutes = (m: number) =>
  m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;

function stageColour(status: string) {
  if (status === 'qc') return 'var(--ink)';
  if (status === 'in_build') return 'var(--ink-60)';
  return 'var(--ink-30)';
}

function KPITile({
  label,
  value,
  delta,
  deltaPositive,
  alert = false,
  bright = false,
  neutral = false,
}: {
  label: string;
  value: string | number;
  delta?: string | null;
  deltaPositive?: boolean;
  alert?: boolean;
  bright?: boolean;
  neutral?: boolean;
}) {
  const isStringValue = typeof value === 'string';
  const deltaColour = alert
    ? '#B94040'
    : neutral
      ? 'var(--ink-60)'
      : deltaPositive
        ? 'var(--ink)'
        : 'var(--ink-30)';

  return (
    <div
      className="min-w-0 border-r border-ink-10 last:border-r-0"
      style={{
        padding: '24px 24px 28px',
        background: bright ? 'var(--paper-2)' : 'transparent',
      }}
    >
      <div
        className="bav-label mb-5 flex items-center gap-2"
        style={{ color: alert ? '#B94040' : 'var(--ink-60)' }}
      >
        {alert && (
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: '#B94040' }}
          />
        )}
        {label}
      </div>
      <div
        className="overflow-hidden truncate whitespace-nowrap"
        style={{
          fontFamily: isStringValue
            ? 'var(--font-jetbrains-mono), ui-monospace, monospace'
            : 'var(--font-fraunces), Georgia, serif',
          fontVariationSettings: isStringValue ? undefined : "'opsz' 144",
          fontWeight: 300,
          fontSize: isStringValue ? 22 : 36,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          className="mt-4"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: deltaColour,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

function IconArrowRight() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function formatActivityTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export default async function AdminDashboard() {
  const store = cookies();
  const session = store.get('bav_session')?.value;
  let firstName = 'Staff';
  if (session?.startsWith('user:')) {
    const u = await prisma.user
      .findUnique({
        where: { userId: session.slice(5) },
        select: { firstName: true },
      })
      .catch(() => null);
    if (u?.firstName) firstName = u.firstName;
  }

  const [kpis, activity, buildQueue] = await Promise.all([
    getExtendedDashboardKpis(),
    getRecentActivity(8),
    getActiveBuildQueue(6),
  ]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLine = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeLine = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto max-w-[1440px]">
        {/* page heading row */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="bav-label mb-3 text-ink-60">— Dashboard</div>
            <h1
              className="m-0 font-display font-light"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontVariationSettings: "'opsz' 144",
              }}
            >
              {greeting},{' '}
              <span className="bav-italic">{firstName}</span>.
            </h1>
            <div
              className="mt-3.5 font-mono tabular-nums text-ink-30"
              style={{ fontSize: 12 }}
            >
              {dateLine} · {timeLine}
            </div>
          </div>

          <DashboardRangeToggle />
        </div>

        {/* KPI strip */}
        <section
          className="mb-20 grid border border-ink-10"
          style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
        >
          <KPITile
            label="Revenue · today"
            value={fmtGbp(kpis.revenueToday.value)}
            delta={fmtDelta(kpis.revenueToday.deltaPct)}
            deltaPositive={kpis.revenueToday.deltaPct > 0}
            bright
          />
          <KPITile
            label="Revenue · 7d"
            value={fmtGbp(kpis.revenueWeek.value)}
            delta={fmtDelta(kpis.revenueWeek.deltaPct)}
            deltaPositive={kpis.revenueWeek.deltaPct > 0}
          />
          <KPITile
            label="Revenue · 30d"
            value={fmtGbp(kpis.revenueMonth.value)}
            delta={fmtDelta(kpis.revenueMonth.deltaPct)}
            deltaPositive={kpis.revenueMonth.deltaPct > 0}
          />
          <KPITile
            label="Orders · today"
            value={kpis.ordersToday.value}
            delta={fmtDelta(kpis.ordersToday.deltaPct)}
            deltaPositive={kpis.ordersToday.deltaPct > 0}
          />
          <KPITile
            label="Flagged returns"
            value={kpis.flaggedReturns.value}
            delta={kpis.flaggedReturns.value > 0 ? 'Needs review' : 'All clear'}
            deltaPositive={false}
            alert={kpis.flaggedReturns.value > 0}
          />
          <KPITile
            label="Active builds"
            value={kpis.activeBuilds.value}
            delta={`${kpis.openTickets.value} open tickets`}
            neutral
          />
        </section>

        {/* split: activity + build queue */}
        <div
          className="grid gap-16"
          style={{ gridTemplateColumns: '3fr 2fr' }}
        >
          {/* Activity */}
          <section>
            <div className="mb-7 flex items-baseline justify-between border-b border-ink-10 pb-4">
              <div>
                <div className="bav-label mb-2 text-ink-60">— 01 · Activity</div>
                <h2
                  className="m-0 font-display font-light"
                  style={{
                    fontSize: 22,
                    letterSpacing: '-0.01em',
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  Last 60 minutes
                </h2>
              </div>
              <Link
                href="/admin/activity"
                className="bav-underline text-[12px] text-ink-60 no-underline"
              >
                Full log
                <IconArrowRight />
              </Link>
            </div>

            <div>
              {activity.length === 0 && (
                <div className="py-8 text-[13px] text-ink-60">
                  No activity yet today.
                </div>
              )}
              {activity.map((a, i) => (
                <Link
                  key={`${a.type}-${a.at}-${i}`}
                  href={a.href}
                  className="bav-activity-row grid items-baseline border-b border-ink-10 py-[18px] no-underline"
                  style={{
                    gridTemplateColumns: '56px 80px 1fr 20px',
                    gap: 16,
                    color: 'var(--ink)',
                  }}
                >
                  <span
                    className="font-mono tabular-nums text-ink-30"
                    style={{ fontSize: 12 }}
                  >
                    {formatActivityTime(a.at)}
                  </span>
                  <span
                    className="bav-label"
                    style={{
                      color:
                        a.tone === 'critical' ? '#B94040' : 'var(--ink-30)',
                    }}
                  >
                    {a.type}
                  </span>
                  <span className="text-ink" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                    {a.title} — {a.subtitle}
                  </span>
                  <span className="justify-self-end text-ink-30">
                    <IconArrowRight />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Build queue */}
          <section>
            <div className="mb-7 flex items-baseline justify-between border-b border-ink-10 pb-4">
              <div>
                <div className="bav-label mb-2 inline-flex items-center gap-2.5 text-ink-60">
                  <span className="bav-pulse" />— 02 · Live build queue
                </div>
                <h2
                  className="m-0 font-display font-light"
                  style={{
                    fontSize: 22,
                    letterSpacing: '-0.01em',
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  On the floor now
                </h2>
              </div>
              <Link
                href="/admin/builder-portal"
                className="bav-underline text-[12px] text-ink-60 no-underline"
              >
                Portal
                <IconArrowRight />
              </Link>
            </div>

            <div>
              {buildQueue.length === 0 && (
                <div className="py-8 text-[13px] text-ink-60">
                  No builds in flight.
                </div>
              )}
              {buildQueue.map((b) => (
                <Link
                  key={b.orderNumber}
                  href={`/admin/orders/${b.orderNumber}`}
                  className="bav-queue-row grid items-center border-b border-ink-10 py-[18px] no-underline"
                  style={{
                    gridTemplateColumns: '64px 1fr auto',
                    gap: 16,
                    color: 'var(--ink)',
                  }}
                >
                  <span
                    className="font-display"
                    style={{
                      fontVariationSettings: "'opsz' 144",
                      fontWeight: 300,
                      fontSize: 22,
                      letterSpacing: '-0.01em',
                      color: stageColour(b.status),
                    }}
                  >
                    {b.buildNumber}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="truncate whitespace-nowrap text-ink"
                      style={{ fontSize: 13 }}
                    >
                      {b.product}
                    </div>
                    <div
                      className="mt-1 text-ink-60"
                      style={{ fontSize: 12 }}
                    >
                      {b.builder.displayName}{' '}
                      <span className="text-ink-30">·</span> {b.stageLabel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="bav-label"
                      style={{
                        color: b.status === 'qc' ? 'var(--ink)' : 'var(--ink-60)',
                      }}
                    >
                      {b.status.replace('_', ' ')}
                    </div>
                    <div
                      className="mt-1 font-mono tabular-nums text-ink-30"
                      style={{ fontSize: 11 }}
                    >
                      {fmtMinutes(b.minutesIn)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
