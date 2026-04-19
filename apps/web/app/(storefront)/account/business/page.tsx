import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';

export const metadata: Metadata = {
  title: 'Trade account',
  description:
    'Your Birmingham AV trade account — account manager, credit utilisation, open quotes and purchase orders in one place.',
};
export const dynamic = 'force-dynamic';

type StatusTone = 'ok' | 'warn' | 'mute';

export default async function BusinessDashboardPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/account/business');

  const account = await prisma.businessAccount.findUnique({
    where: { userId: current.userId },
    include: {
      accountManager: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      quotes: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  if (!account) {
    return (
      <AccountShell activeKey="business">
        <BusinessEmptyState />
      </AccountShell>
    );
  }

  // Recent purchase orders for this user (trade account owner).
  const orders = await prisma.order.findMany({
    where: { userId: current.userId, status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      items: { include: { product: { select: { title: true } } }, take: 1 },
    },
  });

  const ytdStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdAgg = await prisma.order.aggregate({
    where: {
      userId: current.userId,
      createdAt: { gte: ytdStart },
      status: { in: ['paid', 'queued', 'in_build', 'qc', 'shipped', 'delivered'] },
    },
    _sum: { totalGbp: true },
  });

  const ytdSpendGbp = Number(ytdAgg._sum.totalGbp ?? 0);

  const openQuotes = account.quotes.filter((q) =>
    ['submitted', 'awaiting_clarification', 'quoted'].includes(q.status),
  ).length;

  const openPOs = orders.filter((o) =>
    ['paid', 'queued', 'in_build', 'qc', 'shipped'].includes(o.status as string),
  ).length;

  const creditLimit = Number(account.creditLimitGbp);
  const creditUsed = Number(account.creditUsedGbp);
  const creditPct = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  const joinedAtFmt = account.createdAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const amFullName = account.accountManager
    ? [account.accountManager.firstName, account.accountManager.lastName].filter(Boolean).join(' ').trim()
    : '';
  const amInitials = amFullName
    ? amFullName.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('')
    : '—';

  const kpis = [
    { label: 'YTD spend', value: formatGbp(ytdSpendGbp), sub: `from 01 Jan ${ytdStart.getFullYear()}` },
    { label: 'Open quotes', value: String(openQuotes).padStart(2, '0'), sub: 'awaiting review' },
    { label: 'Open POs', value: String(openPOs).padStart(2, '0'), sub: 'in build or shipping' },
    {
      label: 'Credit utilisation',
      value: creditLimit > 0
        ? `${formatGbp(creditUsed)} / ${formatGbp(creditLimit)}`
        : '—',
      sub: creditLimit > 0 ? `${creditPct}% used` : 'Awaiting approval',
      showBar: true,
      barPct: creditPct,
    },
  ];

  return (
    <AccountShell activeKey="business">
      <div className="max-w-[880px]">
        <h1 className="m-0 font-display text-[clamp(32px,3.5vw,48px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          Trade account.
        </h1>

        {/* ROW 1 — Company + account manager */}
        <section className="mt-12 border-t border-ink-10 pt-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12">
            <div>
              <div className="bav-label mb-4 text-ink-60">— Company</div>
              <div className="mb-[14px] font-display text-[28px] font-normal leading-[1.2] text-ink">
                {account.companyName}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {account.vatNumber && (
                  <span className="font-mono text-[12px] tabular-nums text-ink-60">
                    VAT  {account.vatNumber}
                  </span>
                )}
                {account.companyRegNumber && (
                  <span className="font-mono text-[12px] tabular-nums text-ink-60">
                    Co.  {account.companyRegNumber}
                  </span>
                )}
                <span className="font-mono text-[12px] tabular-nums text-ink-30">
                  Since {joinedAtFmt}
                </span>
              </div>
              <div className="mt-5">{statusPill(account.status)}</div>

              <div className="mt-7">
                <Link
                  href="/account/business/team"
                  className="bav-underline text-[13px] text-ink no-underline"
                >
                  <span>Invite a team member</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            <div className="border border-ink-10 p-7">
              <div className="bav-label mb-[18px] text-ink-60">— Account manager</div>
              {account.accountManager ? (
                <>
                  <div className="mb-[14px] flex items-center gap-[14px]">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 font-display text-[16px] text-ink"
                      aria-hidden
                    >
                      {amInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                        {amFullName || account.accountManager.email}
                      </div>
                      <div className="font-mono text-[11px] tabular-nums text-ink-60">Direct line</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-ink-10 pt-4">
                    {account.accountManager.email && (
                      <a
                        href={`mailto:${account.accountManager.email}`}
                        className="bav-hover-opa font-mono text-[12px] tabular-nums text-ink no-underline"
                      >
                        {account.accountManager.email}
                      </a>
                    )}
                    {account.accountManager.phone && (
                      <a
                        href={`tel:${account.accountManager.phone.replace(/\s/g, '')}`}
                        className="bav-hover-opa font-mono text-[12px] tabular-nums text-ink no-underline"
                      >
                        {account.accountManager.phone}
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="m-0 text-[13px] leading-[1.6] text-ink-60">
                  No account manager assigned yet. We&rsquo;ll be in touch within one working day of your
                  application being approved.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ROW 2 — KPI grid */}
        <section className="mt-[72px]">
          <div className="bav-label mb-5 text-ink-60">— At a glance</div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ borderTop: '1px solid var(--ink-10)', borderLeft: '1px solid var(--ink-10)' }}
          >
            {kpis.map((k, i) => (
              <div
                key={k.label}
                className="p-8"
                style={{
                  borderRight: '1px solid var(--ink-10)',
                  borderBottom: '1px solid var(--ink-10)',
                }}
              >
                <div className="bav-label mb-[14px] text-ink-30">
                  {String(i + 1).padStart(2, '0')} · {k.label}
                </div>
                <div className="break-words font-mono text-[22px] tabular-nums tracking-[-0.01em] text-ink">
                  {k.value}
                </div>
                <div className="mt-[6px] text-[12px] text-ink-60">{k.sub}</div>
                {k.showBar && (
                  <div className="relative mt-2 h-[3px] bg-ink-10">
                    <span
                      className="absolute left-0 top-0 h-full bg-ink transition-[width] duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, k.barPct ?? 0))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ROW 3a — Recent quotes */}
        <section className="mt-[72px]">
          <div className="mb-5 flex items-baseline justify-between">
            <div className="bav-label text-ink-60">— Recent quotes</div>
            <Link
              href="/account/business/quotes"
              className="bav-underline text-[12px] text-ink-60 no-underline"
            >
              <span>View all</span>
              <span className="arrow">→</span>
            </Link>
          </div>
          {account.quotes.length === 0 ? (
            <div className="border-t border-b border-ink-10 py-12 text-center text-[14px] text-ink-60">
              No quotes yet.{' '}
              <Link href="/quote" className="bav-underline text-ink no-underline">
                <span>Request one</span>
              </Link>
              .
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TblHead width="22%">Quote</TblHead>
                  <TblHead>Items</TblHead>
                  <TblHead align="right" width={130}>
                    Amount
                  </TblHead>
                  <TblHead width={160}>Status</TblHead>
                </tr>
              </thead>
              <tbody>
                {account.quotes.map((q) => (
                  <tr key={q.quoteId}>
                    <td className="border-b border-ink-10 py-[18px] align-middle font-mono text-[13px] tabular-nums text-ink">
                      {q.quoteNumber}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] align-middle text-[13px] text-ink">
                      {summariseItems(q.itemsJson)}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] text-right align-middle font-mono text-[13px] tabular-nums text-ink">
                      {q.amountGbp ? formatGbp(Number(q.amountGbp)) : '—'}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] align-middle">
                      {statusBadge(humanStatus(q.status), quoteStatusTone(q.status))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ROW 3b — Recent POs */}
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between">
            <div className="bav-label text-ink-60">— Recent purchase orders</div>
            <Link
              href="/account/orders"
              className="bav-underline text-[12px] text-ink-60 no-underline"
            >
              <span>View all</span>
              <span className="arrow">→</span>
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="border-t border-b border-ink-10 py-12 text-center text-[14px] text-ink-60">
              No purchase orders yet.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <TblHead width="24%">Order</TblHead>
                  <TblHead>Items</TblHead>
                  <TblHead align="right" width={120}>
                    Amount
                  </TblHead>
                  <TblHead width={130}>Status</TblHead>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="border-b border-ink-10 py-[18px] align-middle font-mono text-[13px] tabular-nums text-ink">
                      {o.orderNumber}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] align-middle text-[13px] text-ink">
                      {o.items[0]?.product?.title ?? 'Order'}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] text-right align-middle font-mono text-[13px] tabular-nums text-ink">
                      {formatGbp(Number(o.totalGbp ?? 0))}
                    </td>
                    <td className="border-b border-ink-10 py-[18px] align-middle">
                      {statusBadge(humanStatus(o.status as string), 'mute')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="mb-24 mt-16 border-t border-ink-10 pt-6 text-[13px] text-ink-60">
          Payments and VAT invoices will appear here once your account is approved. Detailed invoicing lives at{' '}
          <Link href="/account/business/invoices" className="bav-underline text-ink no-underline">
            <span>All invoices</span>
          </Link>
          .
        </div>
      </div>
    </AccountShell>
  );
}

function BusinessEmptyState() {
  return (
    <div className="max-w-[640px]">
      <div className="bav-label mb-6 text-ink-60">— Trade accounts</div>
      <h1 className="m-0 font-display text-[clamp(32px,3.5vw,48px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
        Open a <span className="bav-italic">trade account</span>.
      </h1>
      <p className="mt-8 max-w-[520px] text-[15px] leading-[1.65] text-ink-60">
        You haven&rsquo;t applied for a Birmingham AV trade account yet. Apply in under two minutes to unlock
        net-30 billing, a dedicated account manager and volume pricing.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/auth/business-register"
          className="bav-cta"
          style={{ width: 'auto', padding: '18px 32px' }}
        >
          Apply for a trade account
        </Link>
      </div>
    </div>
  );
}

function TblHead({
  children,
  width,
  align,
}: {
  children: React.ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      className="bav-label border-b border-ink-10 py-[14px] text-ink-60"
      style={{ textAlign: align ?? 'left', width }}
    >
      {children}
    </th>
  );
}

function statusPill(status: string) {
  const map: Record<
    string,
    { label: string; tone: StatusTone; dot?: boolean }
  > = {
    pending_review: { label: 'Pending review', tone: 'mute' },
    active: { label: 'Active', tone: 'ok', dot: true },
    suspended: { label: 'Suspended', tone: 'warn' },
  };
  const s = map[status] ?? { label: status, tone: 'mute' as StatusTone };
  const color = s.tone === 'warn' ? '#B94040' : s.tone === 'ok' ? 'var(--ink)' : 'var(--ink-60)';
  return (
    <span
      className="bav-label inline-flex items-center gap-2 border border-ink-10 bg-paper-2 px-3 py-[6px]"
      style={{ color }}
    >
      {s.dot && <span className="bav-pulse" aria-hidden />}
      {s.label}
    </span>
  );
}

function statusBadge(label: string, tone: StatusTone) {
  const color = tone === 'warn' ? '#B94040' : tone === 'ok' ? 'var(--ink)' : 'var(--ink-60)';
  return (
    <span className="bav-label" style={{ color }}>
      {label}
    </span>
  );
}

function humanStatus(raw: string) {
  return raw.replace(/_/g, ' ');
}

function quoteStatusTone(status: string): StatusTone {
  if (status === 'quoted' || status === 'converted') return 'ok';
  if (status === 'rejected' || status === 'expired') return 'warn';
  return 'mute';
}

function formatGbp(n: number) {
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function summariseItems(json: unknown): string {
  if (!json || typeof json !== 'object') return '—';
  const arr = Array.isArray(json) ? json : (json as { items?: unknown }).items;
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  const first = arr[0] as { qty?: number | string; spec?: string };
  const spec = typeof first.spec === 'string' ? first.spec : '';
  const more = arr.length > 1 ? ` · +${arr.length - 1} more` : '';
  const qtyNum = typeof first.qty === 'string' ? Number(first.qty) : first.qty;
  return `${qtyNum ? `${qtyNum}× ` : ''}${spec}${more}`.trim() || '—';
}
