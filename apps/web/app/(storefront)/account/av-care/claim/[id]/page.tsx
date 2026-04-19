import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { MessageBlock, type ThreadMessage } from '@/components/thread/MessageBlock';
import '@/components/avcare/avcare.css';
import { ReplySection } from './ReplySection';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Claim ${params.id}`,
    description: `Track your AV Care claim ${params.id}.`,
    robots: { index: false, follow: false },
  };
}

type AvClaimStatus =
  | 'submitted'
  | 'assessing'
  | 'awaiting_excess_payment'
  | 'awaiting_unit'
  | 'in_repair'
  | 'in_qc'
  | 'returning'
  | 'resolved'
  | 'rejected';

const PIPELINE: Array<{ key: AvClaimStatus; label: string }> = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'assessing', label: 'Assessing' },
  { key: 'awaiting_excess_payment', label: 'Excess paid' },
  { key: 'awaiting_unit', label: 'Unit received' },
  { key: 'in_repair', label: 'In repair' },
  { key: 'in_qc', label: 'In QC' },
  { key: 'returning', label: 'Returning' },
  { key: 'resolved', label: 'Resolved' },
];

const STATUS_META: Record<AvClaimStatus, { label: string; tone: 'neutral' | 'active' | 'warn' | 'done' | 'reject' }> = {
  submitted: { label: 'Submitted', tone: 'neutral' },
  assessing: { label: 'Assessing', tone: 'active' },
  awaiting_excess_payment: { label: 'Excess pending', tone: 'warn' },
  awaiting_unit: { label: 'Awaiting unit', tone: 'active' },
  in_repair: { label: 'In repair', tone: 'active' },
  in_qc: { label: 'In QC', tone: 'active' },
  returning: { label: 'Returning', tone: 'active' },
  resolved: { label: 'Resolved', tone: 'done' },
  rejected: { label: 'Rejected', tone: 'reject' },
};

function buildNumberFromSku(sku: string): string | null {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return null;
  return m[1].padStart(3, '0').slice(-3);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—';
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export default async function AvCareClaimDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/account/av-care/claim/${params.id}`);

  const claim = await prisma.avCareClaim.findUnique({
    where: { claimNumber: params.id },
    include: {
      product: true,
      unit: true,
      builder: { select: { displayName: true, builderCode: true } },
      subscription: { select: { status: true, tier: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!claim) notFound();
  if (claim.userId !== user.userId) notFound();

  const status = claim.status as AvClaimStatus;
  const pipelineIdx = PIPELINE.findIndex((s) => s.key === status);
  const statusMeta = STATUS_META[status];

  const pipelineWithTimestamps = PIPELINE.map((step) => {
    let when: Date | null = null;
    switch (step.key) {
      case 'submitted':
        when = claim.createdAt;
        break;
      case 'assessing':
        when = claim.aiAssessmentSummary ? claim.createdAt : null;
        break;
      case 'awaiting_excess_payment':
        when = claim.excessPaidAt;
        break;
      case 'awaiting_unit':
        when = claim.repairStartedAt ? claim.repairStartedAt : null;
        break;
      case 'in_repair':
        when = claim.repairStartedAt;
        break;
      case 'in_qc':
        when = claim.repairCompletedAt;
        break;
      case 'returning':
        when = claim.shippedBackAt;
        break;
      case 'resolved':
        when = claim.resolvedAt;
        break;
    }
    return { ...step, when };
  });

  const showAiAssessment = pipelineIdx >= 1 && !!claim.aiAssessmentSummary;
  const showPayExcess = status === 'awaiting_excess_payment';

  const messages: ThreadMessage[] = [
    {
      id: 'initial',
      authorRole: 'customer',
      authorName: 'You',
      body: claim.description,
      createdAt: fmtDateTime(claim.createdAt),
      attachments: claim.photoUrls.map((url, i) => ({ label: `photo-${i + 1}.jpg`, url })),
    },
    ...claim.messages.map((m) => {
      const senderType = m.senderType as 'customer' | 'ai' | 'builder' | 'support';
      return {
        id: m.messageId,
        authorRole: senderType,
        authorName: senderType === 'builder' && claim.builder ? claim.builder.displayName : undefined,
        body: m.body,
        createdAt: fmtDateTime(m.createdAt),
      } satisfies ThreadMessage;
    }),
  ];

  const unit = claim.unit;
  const product = claim.product;
  const buildNumber = unit
    ? unit.serialNumber.slice(-3)
    : buildNumberFromSku(product.sku);

  return (
    <AccountShell activeKey="av-care" avCareStatus={claim.subscription.status}>
      <nav className="flex flex-wrap items-center" style={{ gap: 12, marginBottom: 24 }}>
        <Link
          href="/account/av-care"
          className="bav-hover-opa bav-label"
          style={{ color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          — AV Care
        </Link>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>/</span>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>Claims</span>
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>/</span>
        <span className="bav-label" style={{ color: 'var(--ink)' }}>{claim.claimNumber}</span>
      </nav>

      <div
        className="flex flex-wrap items-end justify-between"
        style={{ gap: 24, marginBottom: 56 }}
      >
        <div>
          <h1
            className="font-display m-0"
            style={{
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            Claim{' '}
            <span
              className="font-mono"
              style={{ fontSize: '0.82em', fontWeight: 400, color: 'var(--ink)' }}
            >
              {claim.claimNumber}
            </span>
            .
          </h1>
          <div className="flex items-center" style={{ gap: 14 }}>
            <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
            <span style={{ fontSize: 13, color: 'var(--ink-60)' }}>
              Opened <span className="font-mono">{fmtDateTime(claim.createdAt)}</span>
            </span>
          </div>
        </div>

        {showPayExcess && (
          // TODO: wire up the pay-excess route — creates a Stripe
          // PaymentIntent for £100 and redirects back on success.
          <Link
            href={`/account/av-care/claim/${claim.claimNumber}/pay-excess`}
            className="bav-cta"
            style={{ width: 'auto', padding: '18px 32px', textDecoration: 'none' }}
          >
            Pay £100 excess →
          </Link>
        )}
      </div>

      <div className="bav-detail-layout">
        {/* LEFT — timeline + AI */}
        <div className="flex flex-col" style={{ gap: 48 }}>
          <section>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>— Progress</span>
            <h2
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: '12px 0 24px',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
              }}
            >
              Where it is now.
            </h2>

            <ol
              className="m-0 p-0 border-t border-ink-10"
              style={{ listStyle: 'none' }}
            >
              {pipelineWithTimestamps.map((step, i) => {
                const isDone = i < pipelineIdx;
                const isCurrent = i === pipelineIdx;
                const isPending = i > pipelineIdx;
                return (
                  <li
                    key={step.key}
                    className="grid items-center border-b border-ink-10"
                    style={{
                      gridTemplateColumns: '24px 1fr auto',
                      gap: 20,
                      padding: '20px 0',
                    }}
                  >
                    <span
                      className="relative inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: isDone ? 'var(--ink)' : 'transparent',
                        border: `1px solid ${isPending ? 'var(--ink-10)' : 'var(--ink)'}`,
                        marginLeft: 4,
                      }}
                    >
                      {isCurrent && (
                        <span
                          className="absolute"
                          style={{
                            inset: 2,
                            background: 'var(--ink)',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: isPending ? 'var(--ink-30)' : 'var(--ink)',
                        fontWeight: isCurrent ? 500 : 400,
                      }}
                    >
                      {step.label}
                      {isCurrent && (
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-60)',
                            marginLeft: 14,
                            letterSpacing: '0.12em',
                          }}
                        >
                          In progress
                        </span>
                      )}
                    </span>
                    <span
                      className="font-mono text-right"
                      style={{
                        fontSize: 12,
                        color: isPending ? 'var(--ink-30)' : 'var(--ink-60)',
                      }}
                    >
                      {step.when ? fmtDateTime(step.when) : '—'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {showAiAssessment && claim.aiAssessmentSummary && (
            <section
              className="border border-ink-10 bg-paper"
              style={{ padding: '32px 36px' }}
            >
              <div
                className="flex flex-wrap items-baseline justify-between"
                style={{ gap: 16, marginBottom: 20 }}
              >
                <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  — Our assessment
                </span>
                <div className="flex items-baseline" style={{ gap: 24 }}>
                  {claim.aiConfidence !== null && (
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      Confidence{' '}
                      <span
                        className="font-mono"
                        style={{ color: 'var(--ink)', fontSize: 12, marginLeft: 6, letterSpacing: 0 }}
                      >
                        {(Number(claim.aiConfidence) * 100).toFixed(0)}%
                      </span>
                    </span>
                  )}
                  {claim.builder && (
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      Builder{' '}
                      <span
                        className="font-mono"
                        style={{ color: 'var(--ink)', fontSize: 12, marginLeft: 6, letterSpacing: 0 }}
                      >
                        {claim.builder.builderCode}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <p
                className="m-0"
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--ink)',
                  maxWidth: '64ch',
                }}
              >
                {claim.aiAssessmentSummary}
              </p>
              <div
                className="border-t border-ink-10"
                style={{ marginTop: 24, paddingTop: 16 }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: 'var(--ink-30)' }}
                >
                  Generated by our triage model on review of your description and photos. A human
                  builder owns the repair from here.
                </span>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — unit card */}
        <aside className="bav-detail-unit">
          <div
            className="bav-canvas grid place-items-center border-b border-ink-10"
            style={{ aspectRatio: '4 / 5' }}
          >
            <div
              className="font-display"
              style={{
                fontSize: 'clamp(120px, 22vw, 180px)',
                fontWeight: 300,
                color: 'var(--ink)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
              }}
            >
              <span
                className="bav-italic"
                style={{ fontSize: '0.55em', color: 'var(--ink-30)', marginRight: 2 }}
              >
                №
              </span>
              <span className="bav-italic">{buildNumber ?? '—'}</span>
            </div>
          </div>

          <div className="flex flex-col" style={{ padding: 28, gap: 20 }}>
            <div>
              <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — The unit
              </span>
              <h3
                className="font-display"
                style={{
                  fontSize: 22,
                  fontWeight: 300,
                  margin: '10px 0 6px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                }}
              >
                {product.title}
              </h3>
              {product.subtitle && (
                <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>{product.subtitle}</div>
              )}
            </div>

            <div
              className="flex flex-col border-t border-ink-10"
              style={{ gap: 14, paddingTop: 20 }}
            >
              {unit && <DetailRow label="Serial" value={unit.serialNumber} mono />}
              {buildNumber && <DetailRow label="Build №" value={buildNumber} mono />}
              <DetailRow
                label="Warranty"
                value={`${product.warrantyMonths} months · parts & labour`}
              />
              {claim.builder && (
                <DetailRow
                  label="Built by"
                  value={`${claim.builder.displayName} · ${claim.builder.builderCode}`}
                />
              )}
            </div>

            <div
              className="flex flex-col border-t border-ink-10"
              style={{ paddingTop: 20, gap: 10 }}
            >
              <Link
                href={`/product/${product.slug}`}
                className="bav-underline"
                style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              >
                View product
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
              {claim.builder && (
                <Link
                  href={`/builders/${claim.builder.builderCode}`}
                  className="bav-underline"
                  style={{ fontSize: 13, color: 'var(--ink-60)', textDecoration: 'none' }}
                >
                  Meet the builder
                  <span className="arrow" aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Message thread */}
      <section>
        <div
          className="flex flex-wrap items-baseline justify-between"
          style={{ gap: 16, marginBottom: 24 }}
        >
          <div>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>— Updates</span>
            <h2
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: '12px 0 0',
                lineHeight: 1,
                letterSpacing: '-0.015em',
              }}
            >
              The conversation.
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-30)' }}>
            {messages.length} messages
          </span>
        </div>

        <div style={{ marginBottom: 32 }}>
          {messages.map((m) => (
            <MessageBlock key={m.id} message={m} />
          ))}
          <div className="border-t border-ink-10" />
        </div>

        <ReplySection claimNumber={claim.claimNumber} />
      </section>

      <div
        className="flex flex-wrap border-t border-ink-10"
        style={{ marginTop: 72, paddingTop: 32, gap: 32 }}
      >
        <Link
          href="/account/av-care"
          className="bav-underline"
          style={{ fontSize: 13, color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          Back to AV Care
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
        <Link
          href="/help/av-care-claims"
          className="bav-underline"
          style={{ fontSize: 13, color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          How claims work
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
        <Link
          href="/warranty"
          className="bav-underline"
          style={{ fontSize: 13, color: 'var(--ink-60)', textDecoration: 'none' }}
        >
          Read the terms
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </AccountShell>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: 'neutral' | 'active' | 'warn' | 'done' | 'reject';
  label: string;
}) {
  const border =
    tone === 'warn' || tone === 'reject'
      ? '#B94040'
      : tone === 'done'
        ? 'var(--ink-60)'
        : 'var(--ink-10)';
  const color =
    tone === 'warn' || tone === 'reject'
      ? '#B94040'
      : tone === 'done'
        ? 'var(--ink-60)'
        : 'var(--ink)';
  return (
    <span
      className="font-mono inline-block uppercase"
      style={{
        fontSize: 11,
        letterSpacing: '0.08em',
        color,
        border: `1px solid ${border}`,
        padding: '5px 10px',
      }}
    >
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="grid items-baseline"
      style={{ gridTemplateColumns: '1fr auto', gap: 16 }}
    >
      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
        — {label}
      </span>
      <span
        className={`overflow-hidden${mono ? ' font-mono' : ''}`}
        style={{
          fontSize: 13,
          color: 'var(--ink)',
          textAlign: 'right',
          maxWidth: 200,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}
