import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { returnNumber: string };
}): Promise<Metadata> {
  return {
    title: `Return ${params.returnNumber}`,
    description: `Track your Birmingham AV return ${params.returnNumber}.`,
    robots: { index: false, follow: false },
  };
}

const STAGE_ORDER = [
  'requested',
  'approved',
  'in_transit',
  'received',
  'refunded',
  'resolved',
] as const;

const REASON_LABELS: Record<string, string> = {
  dead_on_arrival: 'Dead on arrival',
  hardware_fault: 'Hardware fault',
  not_as_described: 'Not as described',
  damaged_in_transit: 'Damaged in transit',
  changed_mind: 'Changed my mind',
  wrong_item: 'Wrong item',
  other: 'Other',
};

export default async function ReturnDetailPage({
  params,
}: {
  params: { returnNumber: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect(`/auth/login?next=/account/returns/${params.returnNumber}`);

  const [ret, avSub] = await Promise.all([
    prisma.return.findUnique({
      where: { returnNumber: params.returnNumber },
      include: {
        order: true,
        product: true,
        builder: { select: { displayName: true, builderCode: true } },
      },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);

  if (!ret) notFound();
  if (ret.requestedByUserId !== current.userId) notFound();

  const currentIdx = STAGE_ORDER.indexOf(ret.status as (typeof STAGE_ORDER)[number]);

  const stages: Array<{ key: (typeof STAGE_ORDER)[number]; label: string; timestamp: string | null }> = [
    { key: 'requested', label: 'Requested', timestamp: ret.createdAt.toISOString() },
    { key: 'approved', label: 'Approved', timestamp: ret.approvedAt?.toISOString() ?? null },
    { key: 'in_transit', label: 'In transit', timestamp: null },
    { key: 'received', label: 'Received', timestamp: null },
    { key: 'refunded', label: 'Refunded', timestamp: ret.refundedAt?.toISOString() ?? null },
  ];

  const buildNumber = buildNumberFromSku(ret.product.sku);
  const refundGbp = Number(ret.refundAmountGbp);
  const restockingGbp = Number(ret.restockingFeeGbp);
  const aiSeverity = ret.aiSeverity ? Number(ret.aiSeverity) : null;
  const reasonLabel = REASON_LABELS[ret.reason] ?? ret.reason;

  return (
    <AccountShell activeKey="returns" avCareStatus={avSub?.status ?? null}>
      {/* Breadcrumb */}
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          color: 'var(--ink-60)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          marginBottom: 24,
        }}
      >
        <Link href="/account" className="bav-hover-opa" style={{ color: 'var(--ink-60)', textDecoration: 'none' }}>
          Account
        </Link>
        <span style={{ margin: '0 10px', color: 'var(--ink-30)' }}>/</span>
        <Link
          href="/account/returns"
          className="bav-hover-opa"
          style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          Returns
        </Link>
        <span style={{ margin: '0 10px', color: 'var(--ink-30)' }}>/</span>
        <span style={{ color: 'var(--ink)' }}>{ret.returnNumber}</span>
      </div>

      <h1
        className="font-display"
        style={{
          fontWeight: 300,
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          letterSpacing: '-0.01em',
          lineHeight: 1.06,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Your <span className="bav-italic">return</span>.
      </h1>
      <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 12 }}>
        {ret.returnNumber}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-60)', marginBottom: 56 }}>
        Opened {formatDateLong(ret.createdAt)} · Order{' '}
        <Link
          href={`/account/orders/${ret.order.orderNumber}`}
          className="bav-hover-opa"
          style={{ color: 'var(--ink)' }}
        >
          {ret.order.orderNumber}
        </Link>
      </div>

      {/* Two-column: main left, unit sidebar right */}
      <div className="bav-return-grid">
        <div>
          {/* Status timeline — vertical */}
          <section style={{ marginBottom: 64 }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 24 }}>
              — Status
            </div>
            <div style={{ borderTop: '1px solid var(--ink-10)' }}>
              {stages.map((s, i) => {
                const done = i < currentIdx;
                const current = s.key === ret.status;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr auto',
                      gap: 16,
                      padding: '18px 0',
                      borderBottom: '1px solid var(--ink-10)',
                      alignItems: 'center',
                    }}
                  >
                    {current ? (
                      <span className="bav-pulse" aria-hidden="true" style={{ margin: '0 auto' }} />
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          margin: '0 auto',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: done ? 'var(--ink)' : 'var(--ink-30)',
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        color: done || current ? 'var(--ink)' : 'var(--ink-30)',
                        fontWeight: current ? 500 : 400,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-60)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      {s.timestamp ? formatDateShort(s.timestamp) : current ? 'Now' : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Reason + detail */}
          <section style={{ marginBottom: 64 }}>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
              — Reason
            </div>
            <div style={{ fontSize: 16, marginBottom: 20 }}>{reasonLabel}</div>
            {ret.reasonDetails && (
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--ink-60)',
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: 540,
                }}
              >
                &ldquo;{ret.reasonDetails}&rdquo;
              </p>
            )}
          </section>

          {/* AI / assessment panel */}
          {ret.aiFlaggedPattern && (
            <section
              style={{ marginBottom: 64, border: '1px solid var(--ink-10)', padding: 28 }}
            >
              <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
                — Our assessment
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--ink)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginBottom: 18,
                }}
              >
                {ret.aiFlaggedPattern}
              </p>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {aiSeverity !== null && (
                  <div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-60)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        marginBottom: 4,
                      }}
                    >
                      Severity
                    </div>
                    <div className="font-mono" style={{ fontSize: 15 }}>
                      {(aiSeverity * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                <div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-60)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      marginBottom: 4,
                    }}
                  >
                    Refund
                  </div>
                  <div className="font-mono" style={{ fontSize: 15 }}>
                    £{refundGbp.toFixed(2)}
                  </div>
                </div>
                {restockingGbp > 0 && (
                  <div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-60)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        marginBottom: 4,
                      }}
                    >
                      Restocking
                    </div>
                    <div className="font-mono" style={{ fontSize: 15 }}>
                      −£{restockingGbp.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Resolution notes when present */}
          {ret.resolutionNotes && (
            <section style={{ marginBottom: 64 }}>
              <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>
                — Resolution
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--ink)',
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: 540,
                }}
              >
                {ret.resolutionNotes}
              </p>
            </section>
          )}

          {/* Support link */}
          <section>
            <Link
              href="/support"
              className="bav-underline font-mono"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              Need to add something? Contact support <span className="arrow">→</span>
            </Link>
          </section>
        </div>

        {/* Unit sidebar */}
        <aside className="bav-return-sidebar" style={{ position: 'sticky', top: 96 }}>
          <div style={{ border: '1px solid var(--ink-10)' }}>
            <div
              className="bav-canvas"
              style={{
                aspectRatio: '4 / 5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                className="font-display bav-italic"
                style={{
                  fontWeight: 300,
                  fontSize: 'clamp(64px, 14vw, 120px)',
                  lineHeight: 1,
                  color: 'var(--ink)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span style={{ fontSize: '0.45em', verticalAlign: 'super', marginRight: 2 }}>№</span>
                {buildNumber ?? '—'}
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 12 }}>
                — The unit
              </div>
              <Link
                href={`/product/${ret.product.slug}`}
                className="bav-hover-opa"
                style={{
                  textDecoration: 'none',
                  color: 'var(--ink)',
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, lineHeight: 1.3 }}>{ret.product.title}</div>
              </Link>
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-60)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 16,
                }}
              >
                {ret.product.sku}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--ink-10)',
                  paddingTop: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  rowGap: 10,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Order</div>
                <div className="font-mono" style={{ fontSize: 12 }}>
                  {ret.order.orderNumber}
                </div>
                {ret.builder && (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Built by</div>
                    <div style={{ fontSize: 13 }}>{ret.builder.displayName}</div>
                  </>
                )}
                <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>Refund</div>
                <div className="font-mono" style={{ fontSize: 13 }}>
                  £{refundGbp.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AccountShell>
  );
}

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}

function formatDateLong(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
function formatDateShort(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}
