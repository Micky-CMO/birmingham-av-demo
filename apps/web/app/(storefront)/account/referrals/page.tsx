import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { ReferralsInvite } from '@/components/account/ReferralsInvite';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Referrals · Birmingham AV' };

const ink60 = 'var(--ink-60)';
const ink30 = 'var(--ink-30)';
const ink10 = 'var(--ink-10)';

function statusMeta(s: string) {
  if (s === 'purchased' || s === 'rewarded')
    return { dot: '#1EB53A', color: '#1EB53A', label: 'Ordered — credit earned', pulse: true };
  if (s === 'signed_up')
    return { dot: 'var(--ink-60)', color: 'var(--ink-60)', label: 'Signed up', pulse: false };
  if (s === 'invited') return { dot: 'var(--ink-30)', color: 'var(--ink-60)', label: 'Invited', pulse: false };
  return { dot: 'var(--ink-30)', color: 'var(--ink-60)', label: s, pulse: false };
}

export default async function AccountReferralsPage() {
  const isStaff = cookies().get('bav_staff')?.value === '1';
  if (isStaff) redirect('/admin/dashboard');

  const current = await getCurrentUser();
  if (!current) redirect('/auth/login');

  const [code, referrals] = await Promise.all([
    prisma.referralCode.findUnique({ where: { userId: current.userId } }),
    prisma.referral.findMany({
      where: { referrerUserId: current.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const invited = referrals.length;
  const signedUp = referrals.filter((r) => r.status !== 'invited').length;
  const ordered = referrals.filter((r) => r.status === 'purchased' || r.status === 'rewarded').length;
  const creditEarned = Number(code?.totalEarnedGbp ?? 0);
  const creditRemaining = referrals.reduce(
    (acc, r) => acc + Number(r.rewardPendingGbp) + Number(r.rewardPaidGbp),
    0,
  );

  const codeSlug = code?.code ?? 'your-code';
  const shareUrl = `bhm.av/r/${codeSlug}`;

  return (
    <AccountShell activeKey="referrals">
      <div style={{ maxWidth: 880 }}>
        <div className="bav-label mb-3.5" style={{ color: ink60 }}>— Account · Referrals</div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(40px, 4vw, 56px)',
            letterSpacing: '-0.01em',
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Referrals.
        </h1>

        <div
          className="mt-12 grid gap-12 border-b pb-12"
          style={{ gridTemplateColumns: '7fr 5fr', borderColor: ink10 }}
        >
          <div>
            <h2
              className="font-display font-light"
              style={{
                fontSize: 'clamp(40px, 5vw, 56px)',
                margin: 0,
                letterSpacing: '-0.015em',
                lineHeight: 1.08,
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Send the shop to<br />
              someone who&rsquo;d <span className="bav-italic">get it</span>.
            </h2>
            <p
              className="mt-6 max-w-[420px] text-[14px] leading-[1.65]"
              style={{ color: ink60 }}
            >
              When someone you refer spends over £500, you both get £25 credit. Your credit lands
              in your account on their order dispatch.
            </p>
          </div>

          <ReferralsInvite shareUrl={shareUrl} existingCode={code?.code ?? null} />
        </div>

        {/* stats strip */}
        <div
          className="grid border-b"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', borderColor: ink10, padding: '24px 0' }}
        >
          {[
            { label: 'Friends invited', value: invited.toString() },
            { label: 'Signed up', value: signedUp.toString() },
            { label: 'Ordered', value: `${ordered} · £${creditEarned.toFixed(0)} earned` },
            { label: 'Credit remaining', value: `£${creditRemaining.toFixed(0)}` },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                padding: '0 20px',
                borderRight: i < arr.length - 1 ? `1px solid ${ink10}` : 'none',
              }}
            >
              <div className="bav-label mb-2" style={{ color: ink30 }}>{s.label}</div>
              <div className="font-mono tabular-nums" style={{ fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* invited list */}
        <section
          className="border-b"
          style={{ borderColor: ink10, paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="bav-label mb-3.5" style={{ color: ink60 }}>— Invited</div>
          <h3
            className="font-display font-light"
            style={{
              fontSize: 32,
              margin: 0,
              letterSpacing: '-0.01em',
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Who you&rsquo;ve told.
          </h3>

          <div className="mt-8" style={{ borderTop: '1px solid var(--ink)' }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: '220px 200px 140px 80px',
                padding: '12px 0',
                borderBottom: `1px solid ${ink10}`,
                gap: 16,
              }}
            >
              <div className="bav-label" style={{ color: ink60 }}>Email</div>
              <div className="bav-label" style={{ color: ink60 }}>Status</div>
              <div className="bav-label" style={{ color: ink60 }}>Invited</div>
              <div className="bav-label" style={{ color: ink60, textAlign: 'right' }}>Credit</div>
            </div>
            {referrals.length === 0 && (
              <div className="py-10 text-[13px]" style={{ color: ink60 }}>
                You haven&rsquo;t sent any invites yet. Drop your link in a group chat.
              </div>
            )}
            {referrals.map((r) => {
              const sm = statusMeta(r.status);
              const pending = Number(r.rewardPendingGbp);
              const paid = Number(r.rewardPaidGbp);
              const total = pending + paid;
              return (
                <div
                  key={r.referralId}
                  className="grid"
                  style={{
                    gridTemplateColumns: '220px 200px 140px 80px',
                    padding: '16px 0',
                    borderBottom: `1px solid ${ink10}`,
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div className="font-mono" style={{ fontSize: 12 }}>
                    {r.referredEmail}
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
                  <div className="font-mono" style={{ fontSize: 11, color: ink60 }}>
                    {r.createdAt.toISOString().slice(0, 10)}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 13, color: total > 0 ? '#1EB53A' : ink30, textAlign: 'right' }}
                  >
                    {total > 0 ? `£${total.toFixed(2)}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="border-b"
          style={{ borderColor: ink10, paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { n: '01', title: 'Send your link.', body: 'By text, email, Slack. No referrer-app nonsense.' },
              {
                n: '02',
                title: 'They order over £500.',
                body: 'Their first order — any category. One week to place it, 30 days to actually ship.',
              },
              {
                n: '03',
                title: 'Both get £25 credit.',
                body: 'Applied automatically. Lands the day their order dispatches.',
              },
            ].map((step) => (
              <div key={step.n}>
                <div
                  className="font-display bav-italic"
                  style={{
                    fontWeight: 300,
                    fontSize: 'clamp(72px, 10vw, 112px)',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    marginBottom: 16,
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  <span style={{ fontSize: '0.45em', verticalAlign: 'super', marginRight: 2 }}>№</span>
                  {step.n}
                </div>
                <div
                  className="font-display"
                  style={{ fontWeight: 400, fontSize: 18, marginBottom: 10, fontVariationSettings: "'opsz' 144" }}
                >
                  {step.title}
                </div>
                <p className="m-0 text-[13px] leading-[1.65]" style={{ color: ink60 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-12 text-[13px]" style={{ color: ink30 }}>
          Full terms on the{' '}
          <a href="/referrals/terms" className="bav-underline" style={{ color: ink60 }}>
            referrals policy page <span className="arrow">→</span>
          </a>
          . Credits expire 12 months after issue. One referral credit per unique household.
        </div>
      </div>
    </AccountShell>
  );
}
