import type { Metadata } from 'next';
import { prisma, connectMongo } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Status · Birmingham AV',
  description: 'Live health of the Birmingham AV storefront, workshop, and integrations.',
};

type HealthStatus = 'operational' | 'degraded' | 'down';

type ServiceRow = {
  key: string;
  name: string;
  status: HealthStatus;
  note: string;
  latencyMs: number | null;
};

const green = '#1EB53A';
const amber = '#A8751C';
const red = '#B94040';
const ink60 = 'var(--ink-60)';
const ink30 = 'var(--ink-30)';
const ink10 = 'var(--ink-10)';

type StatusPageApiResponse = {
  status?: { indicator?: string; description?: string };
};

async function checkPostgres(): Promise<ServiceRow> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      key: 'postgres',
      name: 'Postgres database',
      status: 'operational',
      note: 'Primary store responding to ping.',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      key: 'postgres',
      name: 'Postgres database',
      status: 'down',
      note: err instanceof Error ? err.message : 'unreachable',
      latencyMs: null,
    };
  }
}

async function checkMongo(): Promise<ServiceRow> {
  const start = Date.now();
  try {
    await connectMongo();
    return {
      key: 'mongo',
      name: 'Mongo catalogue',
      status: 'operational',
      note: 'Connected to catalogue cluster.',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      key: 'mongo',
      name: 'Mongo catalogue',
      status: 'down',
      note: err instanceof Error ? err.message : 'connection failed',
      latencyMs: null,
    };
  }
}

async function fetchStatusPage(name: string, key: string, url: string): Promise<ServiceRow> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return {
        key,
        name,
        status: 'degraded',
        note: `HTTP ${res.status}`,
        latencyMs: Date.now() - start,
      };
    }
    const data = (await res.json()) as StatusPageApiResponse;
    const indicator = data.status?.indicator ?? 'unknown';
    const description = data.status?.description ?? indicator;
    const normal: HealthStatus =
      indicator === 'none'
        ? 'operational'
        : indicator === 'minor' || indicator === 'maintenance'
          ? 'degraded'
          : indicator === 'major' || indicator === 'critical'
            ? 'down'
            : 'operational';
    return {
      key,
      name,
      status: normal,
      note: description,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      key,
      name,
      status: 'degraded',
      note: err instanceof Error ? err.message : 'fetch failed',
      latencyMs: null,
    };
  }
}

function checkIngress(): ServiceRow {
  // If we're rendering this, Next.js/Vercel is serving requests successfully.
  return {
    key: 'ingress',
    name: 'Ingress & storefront',
    status: 'operational',
    note: 'Rendering responses from the edge.',
    latencyMs: 0,
  };
}

function statusMeta(s: HealthStatus) {
  if (s === 'operational') return { dot: green, color: green, label: 'Operational', pulse: true };
  if (s === 'degraded') return { dot: amber, color: amber, label: 'Degraded', pulse: false };
  return { dot: red, color: red, label: 'Down', pulse: false };
}

function overallMeta(services: ServiceRow[]) {
  const hasDown = services.some((s) => s.status === 'down');
  const hasDegraded = services.some((s) => s.status === 'degraded');
  if (hasDown) return { headline: 'Major', swash: 'incident' };
  if (hasDegraded) return { headline: 'Partial', swash: 'outage' };
  return { headline: 'All systems', swash: 'operational' };
}

export default async function PublicStatusPage() {
  const [ingress, postgres, mongo, resend, stripe] = await Promise.all([
    checkIngress(),
    checkPostgres(),
    checkMongo(),
    fetchStatusPage('Email delivery (Resend)', 'resend', 'https://status.resend.com/api/v2/status.json'),
    fetchStatusPage('Payments (Stripe)', 'stripe', 'https://status.stripe.com/api/v2/status.json'),
  ]);
  const services: ServiceRow[] = [ingress, postgres, mongo, resend, stripe];
  const om = overallMeta(services);

  const now = new Date();
  const lastChecked = now.toISOString().slice(11, 16) + ' UTC';

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto" style={{ maxWidth: 960, padding: '0 24px' }}>
        <header
          className="flex items-center justify-between"
          style={{ height: 60, borderBottom: `1px solid ${ink10}` }}
        >
          <a
            href="/"
            className="font-display font-light"
            style={{ fontSize: 20, letterSpacing: 0, color: 'var(--ink)', textDecoration: 'none' }}
          >
            Birmingham AV
          </a>
          <div className="font-mono" style={{ fontSize: 11, color: ink60 }}>
            Last checked {lastChecked}
          </div>
        </header>

        <section className="bav-fade" style={{ paddingTop: 96, paddingBottom: 48 }}>
          <div className="bav-label mb-5" style={{ color: ink60 }}>— Current status</div>
          <h1
            className="m-0 font-display font-light"
            style={{
              fontSize: 'clamp(56px, 9vw, 104px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.02,
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {om.headline} <span className="bav-italic">{om.swash}</span>.
          </h1>
        </section>

        <section
          style={{ paddingTop: 48, paddingBottom: 64, borderTop: `1px solid ${ink10}` }}
        >
          <div className="bav-label mb-8" style={{ color: ink60 }}>— Services</div>
          <div style={{ borderTop: `1px solid ${ink10}` }}>
            {services.map((svc) => {
              const sm = statusMeta(svc.status);
              return (
                <div
                  key={svc.key}
                  style={{ padding: '24px 0', borderBottom: `1px solid ${ink10}` }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: '1fr 160px 120px',
                      alignItems: 'center',
                      gap: 20,
                    }}
                  >
                    <div>
                      <div
                        className="font-display"
                        style={{ fontWeight: 400, fontSize: 16, fontVariationSettings: "'opsz' 144" }}
                      >
                        {svc.name}
                      </div>
                      {svc.note && (
                        <div className="mt-1 text-[12px]" style={{ color: ink60 }}>
                          {svc.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sm.pulse ? (
                        <span className="bav-pulse" aria-hidden="true" />
                      ) : (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: sm.dot,
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <span className="bav-label" style={{ color: sm.color }}>{sm.label}</span>
                    </div>
                    <div
                      className="font-mono tabular-nums text-right"
                      style={{ fontSize: 13, color: 'var(--ink)' }}
                    >
                      {svc.latencyMs === null ? '—' : `${svc.latencyMs}ms`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          style={{ paddingTop: 64, paddingBottom: 96, borderTop: `1px solid ${ink10}` }}
        >
          <div className="bav-label mb-3.5" style={{ color: ink60 }}>— About this page</div>
          <h2
            className="m-0 font-display font-light"
            style={{ fontSize: 32, letterSpacing: '-0.01em', fontVariationSettings: "'opsz' 144" }}
          >
            Live checks.
          </h2>
          <p
            className="mt-5 max-w-[640px] text-[13px] leading-[1.65]"
            style={{ color: ink60 }}
          >
            Every load runs a Postgres <span className="font-mono">SELECT 1</span>, opens a Mongo
            connection, and fetches the public status feeds from Resend and Stripe. No cached
            tokens; what you see is what we&rsquo;re seeing.
          </p>
          <div className="mt-5 text-[12px]" style={{ color: ink30 }}>
            Last refresh {lastChecked}. Hit reload to re-run the checks.
          </div>
        </section>
      </div>
    </main>
  );
}
