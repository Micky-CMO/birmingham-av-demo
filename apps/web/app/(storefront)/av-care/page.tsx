import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { TierCard } from '@/components/avcare/TierCard';

export const metadata: Metadata = {
  title: 'AV Care',
  description:
    'AV Care is a monthly subscription covering parts and labour across every Birmingham AV product registered to your account. Flat £100 excess per claim. 30-day free trial.',
};
export const dynamic = 'force-dynamic';

const ESSENTIAL_FEATURES = [
  { label: 'Parts and labour on any registered product' },
  { label: 'In-workshop repair at our Birmingham facility' },
  { label: 'Standard turnaround, typically 7 to 10 working days' },
  { label: '£100 excess per claim' },
  { label: 'Cancel any time' },
];

const PLUS_FEATURES = [
  { label: 'Everything in Essential' },
  { label: 'Courier collection and return' },
  { label: 'Priority turnaround, typically 3 to 5 working days' },
  { label: 'Single loan unit during the repair' },
  { label: '£100 excess per claim' },
  { label: 'Cancel any time' },
];

const STEPS = [
  {
    num: '01',
    title: 'Submit',
    body: 'Describe the fault, upload a photo or two. Two minutes. We will confirm we have it.',
  },
  {
    num: '02',
    title: 'Assess',
    body:
      'A builder triages the claim. If it is covered, we take the £100 excess and arrange the machine in — courier on Plus, post-in on Essential.',
  },
  {
    num: '03',
    title: 'Repair',
    body:
      'Parts and labour on us. Stress-tested, re-QC\u2019d, returned. Plus tier has a loan unit with you while the original is in the workshop.',
  },
];

export default async function AvCareMarketingPage() {
  const user = await getCurrentUser();
  const existingSub = user
    ? await prisma.avCareSubscription.findUnique({
        where: { userId: user.userId },
        select: { tier: true, status: true },
      })
    : null;

  const alreadySubscribed =
    existingSub &&
    existingSub.status !== 'cancelled' &&
    existingSub.status !== 'expired';
  const subscribedTierLabel = existingSub
    ? existingSub.tier === 'plus'
      ? 'Plus'
      : 'Essential'
    : null;

  return (
    <div className="bav-fade">
      {/* Hero */}
      <section
        className="mx-auto"
        style={{ maxWidth: 1440, padding: '144px 48px 104px' }}
      >
        <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
          — Monthly subscription · 30-day free trial
        </span>
        <h1
          className="font-display"
          style={{
            fontWeight: 300,
            fontSize: 'clamp(56px, 8vw, 112px)',
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            margin: '32px 0 48px',
            maxWidth: '14ch',
          }}
        >
          Keep it running,
          <br />
          <span className="bav-italic">indefinitely</span>.
        </h1>
        <p
          className="m-0"
          style={{
            fontSize: 19,
            lineHeight: 1.55,
            color: 'var(--ink)',
            maxWidth: '58ch',
          }}
        >
          AV Care is a monthly subscription covering parts and labour across every Birmingham AV
          product registered to your account. A flat £100 excess per claim. No cap on the number of
          claims, no expiry on the machines it covers. First 30 days free.
        </p>
        <div
          className="flex flex-wrap items-center"
          style={{ gap: 32, marginTop: 56 }}
        >
          <Link
            href="#tiers"
            className="bav-underline"
            style={{ fontSize: 14, color: 'var(--ink)', textDecoration: 'none' }}
          >
            See the plans
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <Link
            href="/warranty"
            className="bav-underline"
            style={{ fontSize: 14, color: 'var(--ink-60)', textDecoration: 'none' }}
          >
            Read the terms
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>

        {alreadySubscribed && subscribedTierLabel && (
          <div
            className="mt-14 flex items-center border border-ink-10"
            style={{ padding: '18px 24px', gap: 14, maxWidth: 640 }}
          >
            <span className="bav-pulse" aria-hidden="true" />
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>
              You are already on AV Care{' '}
              <span className="bav-italic">{subscribedTierLabel}</span>.
            </span>
            <Link
              href="/account/av-care"
              className="bav-underline ml-auto"
              style={{ fontSize: 13, color: 'var(--ink-60)', textDecoration: 'none' }}
            >
              Manage
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>

      {/* Hairline */}
      <div
        className="mx-auto border-t border-ink-10"
        style={{ maxWidth: 1440 }}
      />

      {/* Tier cards */}
      <section id="tiers" style={{ padding: '128px 0' }}>
        <div
          className="mx-auto grid"
          style={{
            gridTemplateColumns: '4fr 8fr',
            gap: 48,
            maxWidth: 1440,
            padding: '0 48px',
            marginBottom: 80,
          }}
        >
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — The plans
          </span>
          <div>
            <h2
              className="font-display m-0"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1.02,
                letterSpacing: '-0.015em',
                maxWidth: '14ch',
              }}
            >
              Two tiers. One excess.
            </h2>
            <p
              className="m-0"
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: 'var(--ink-60)',
                marginTop: 24,
                maxWidth: '52ch',
              }}
            >
              Essential for post-in repair at the workshop. Plus for courier collection, priority
              turnaround, and a loan unit while yours is with us. Same £100 excess either way.
            </p>
          </div>
        </div>

        <div
          className="mx-auto grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 32, maxWidth: 1120, padding: '0 48px' }}
        >
          <TierCard
            tier="essential"
            priceGbp={14.99}
            blurb="Parts and labour across every product registered to your account. Repaired in our Birmingham workshop on a standard turnaround."
            features={ESSENTIAL_FEATURES}
            ctaLabel={
              alreadySubscribed && existingSub?.tier === 'essential'
                ? 'Current plan'
                : 'Start free trial'
            }
            ctaVariant="primary"
            ctaHref="/av-care/subscribe?plan=essential"
            currentPlanLabel={
              alreadySubscribed && existingSub?.tier === 'essential' ? 'Current plan' : null
            }
          />
          <TierCard
            tier="plus"
            priceGbp={29.99}
            blurb="Everything in Essential, plus courier collection, priority turnaround, and a loan unit while yours is with us."
            features={PLUS_FEATURES}
            ctaLabel={
              alreadySubscribed && existingSub?.tier === 'plus' ? 'Current plan' : 'Choose Plus'
            }
            ctaVariant="secondary"
            ctaHref="/av-care/subscribe?plan=plus"
            currentPlanLabel={
              alreadySubscribed && existingSub?.tier === 'plus' ? 'Current plan' : null
            }
          />
        </div>
      </section>

      <div className="mx-auto border-t border-ink-10" style={{ maxWidth: 1440 }} />

      {/* How a claim works */}
      <section style={{ padding: '128px 0' }}>
        <div
          className="mx-auto grid"
          style={{
            gridTemplateColumns: '4fr 8fr',
            gap: 48,
            maxWidth: 1440,
            padding: '0 48px',
            marginBottom: 80,
          }}
        >
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — How a claim works
          </span>
          <div>
            <h2
              className="font-display m-0"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1.02,
                letterSpacing: '-0.015em',
                maxWidth: '14ch',
              }}
            >
              Three steps. No paperwork.
            </h2>
            <p
              className="m-0"
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: 'var(--ink-60)',
                marginTop: 24,
                maxWidth: '52ch',
              }}
            >
              Claims live inside your account. Submit from any device. We will confirm within a
              working day and a builder will own the repair end to end.
            </p>
          </div>
        </div>

        <div
          className="mx-auto grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 48, maxWidth: 1440, padding: '0 48px' }}
        >
          {STEPS.map((s) => (
            <article key={s.num} className="flex flex-col" style={{ gap: 24 }}>
              <div
                className="font-display"
                style={{
                  fontWeight: 300,
                  fontSize: 'clamp(120px, 14vw, 200px)',
                  lineHeight: 0.9,
                  color: 'var(--ink)',
                  letterSpacing: '-0.04em',
                }}
              >
                <span
                  className="bav-italic"
                  style={{ color: 'var(--ink-30)', fontSize: '0.55em', marginRight: 4 }}
                >
                  №
                </span>
                <span className="bav-italic">{s.num}</span>
              </div>
              <div className="border-t border-ink-10" style={{ paddingTop: 24 }}>
                <h3
                  className="font-display"
                  style={{
                    fontWeight: 300,
                    fontSize: 24,
                    margin: '0 0 12px',
                    lineHeight: 1.1,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="m-0"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'var(--ink-60)',
                    maxWidth: '36ch',
                  }}
                >
                  {s.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto border-t border-ink-10" style={{ maxWidth: 1440 }} />

      {/* Closing */}
      <section style={{ padding: '128px 0 96px' }}>
        <div
          className="mx-auto text-left"
          style={{ maxWidth: 880, padding: '0 48px' }}
        >
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Start today
          </span>
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              margin: '32px 0 32px',
            }}
          >
            Thirty days free.
            <br />
            Then <span className="bav-italic">£14.99</span> a month.
          </h2>
          <p
            className="m-0"
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--ink-60)',
              marginBottom: 48,
              maxWidth: '52ch',
            }}
          >
            Subscribing covers every Birmingham AV product on your account, present and future.
            Cancel any time from your account. No exit fee.
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: 16, maxWidth: 600 }}
          >
            <Link
              href="/av-care/subscribe?plan=essential"
              className="bav-cta"
              style={{ textDecoration: 'none' }}
            >
              Start free trial
            </Link>
            <Link
              href="/warranty"
              className="bav-cta-secondary"
              style={{ textDecoration: 'none' }}
            >
              Read the terms
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
