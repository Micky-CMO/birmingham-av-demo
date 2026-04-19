'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const DENOMINATIONS = [50, 100, 250, 500];

const FAQS = [
  {
    q: 'How do I redeem a gift card?',
    a: 'Each card arrives as an email with a 16-character redemption code. Enter it at checkout in the promo code field. The balance is applied against the order total, including shipping and VAT. Any remainder stays on the card.',
  },
  {
    q: 'Does it expire?',
    a: 'Birmingham AV gift cards carry a 24-month validity from the date of issue. If any balance remains beyond that point, email support and we will extend on request. We do not expire cards as a revenue trick.',
  },
  {
    q: 'Can I cancel a gift card?',
    a: 'Unredeemed cards can be refunded in full within 14 days of purchase. Once any portion has been spent the remaining balance is non-refundable, but it stays on the card until redeemed or the card expires.',
  },
];

type Mode = 'preset' | 'custom';
type SendMode = 'now' | 'schedule';

type FormState = {
  amount: number;
  custom: string;
  mode: Mode;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  sendMode: SendMode;
  sendDate: string;
};

const INITIAL: FormState = {
  amount: 100,
  custom: '',
  mode: 'preset',
  recipientName: '',
  recipientEmail: '',
  senderName: '',
  message: '',
  sendMode: 'now',
  sendDate: '',
};

const inputBase =
  'bg-transparent border-0 border-b border-ink-10 px-0 py-[10px] pb-3 text-[14px] text-ink outline-none transition-colors focus:border-ink';

export function GiftCardsClient() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = form.mode === 'custom' ? Number(form.custom) || 0 : form.amount;

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountGbp: effectiveAmount,
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          senderName: form.senderName,
          message: form.message,
          deliverAt: form.sendMode === 'schedule' ? form.sendDate : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: { message?: string };
      };
      if (res.status === 501) {
        setError(
          data.error?.message ??
            'Gift card purchases are coming soon — we are finalising payment integration.',
        );
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data.error?.message ?? 'Could not start checkout. Try again.');
        setSubmitting(false);
        return;
      }
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-12 pb-32 pt-20">
        {/* HERO */}
        <div className="bav-fade mb-24 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-[72px]">
          <div>
            <div className="bav-label mb-8 text-ink-60">— Gift cards</div>
            <h1 className="m-0 font-display text-[clamp(52px,7vw,108px)] font-light leading-[0.98] tracking-[-0.03em]">
              A <span className="bav-italic">gift</span>,<br />
              considered.
            </h1>
            <p className="mt-10 max-w-[480px] text-[16px] leading-[1.65] text-ink-60">
              For the person in your life who would rather pick their own graphics card. Delivered by email,
              redeemable across the entire catalogue, valid for twenty-four months.
            </p>
            <p className="mt-4 max-w-[480px] text-[13px] leading-[1.65] text-ink-30">
              No discount, no expiry tricks, no fine print.
            </p>
          </div>

          <div
            className="bav-canvas flex flex-col p-12"
            style={{ aspectRatio: '4 / 3', position: 'relative' }}
          >
            <div className="bav-label relative z-[1] text-ink-60">— Birmingham AV</div>
            <div className="relative z-[1] flex flex-1 items-center justify-center">
              <div
                className="bav-italic font-display font-light leading-none"
                style={{
                  fontSize: 'clamp(80px, 12vw, 180px)',
                  color: 'rgba(23,20,15,0.9)',
                }}
              >
                {effectiveAmount ? `£${effectiveAmount}` : '£—'}
              </div>
            </div>
            <div className="relative z-[1] flex items-end justify-between">
              <div className="bav-label text-ink-60">XXXX · XXXX · XXXX · XXXX</div>
              <div className="text-[11px] italic text-ink-30">preview</div>
            </div>
          </div>
        </div>

        {/* PURCHASE FORM */}
        <form onSubmit={onSubmit} className="bav-fade border-t border-ink-10 pt-14">
          {error && (
            <div
              role="alert"
              className="mb-8 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 md:grid-cols-[5fr_7fr] md:gap-20">
            <div>
              <div className="bav-label text-ink-60">— Design</div>
              <p className="mt-4 max-w-[340px] text-[13px] leading-[1.6] text-ink-60">
                Pick an amount, write a short note, choose when it arrives. Payment is taken at checkout; the
                recipient sees only the amount and your message.
              </p>
            </div>

            <div>
              {/* Amount */}
              <div className="mb-12">
                <div className="bav-label mb-[18px] text-ink-60">— Amount</div>
                <div
                  className="grid grid-cols-2 sm:grid-cols-5"
                  style={{ borderTop: '1px solid var(--ink-10)', borderLeft: '1px solid var(--ink-10)' }}
                >
                  {DENOMINATIONS.map((d) => {
                    const active = form.mode === 'preset' && form.amount === d;
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setForm((f) => ({ ...f, mode: 'preset', amount: d }))}
                        className="flex cursor-pointer flex-col items-center justify-center gap-1 font-mono tabular-nums transition-all"
                        style={{
                          padding: '32px 12px',
                          borderRight: '1px solid var(--ink-10)',
                          borderBottom: '1px solid var(--ink-10)',
                          background: active ? 'var(--ink)' : 'transparent',
                          color: active ? 'var(--paper)' : 'var(--ink-60)',
                        }}
                      >
                        <span style={{ fontSize: 26, letterSpacing: '-0.01em' }}>£{d}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: 'custom' }))}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1 transition-all"
                    style={{
                      padding: '32px 12px',
                      borderRight: '1px solid var(--ink-10)',
                      borderBottom: '1px solid var(--ink-10)',
                      background: form.mode === 'custom' ? 'var(--ink)' : 'transparent',
                      color: form.mode === 'custom' ? 'var(--paper)' : 'var(--ink-60)',
                    }}
                  >
                    <span
                      className="bav-label"
                      style={{ color: form.mode === 'custom' ? 'var(--paper)' : 'var(--ink-60)' }}
                    >
                      Custom
                    </span>
                  </button>
                </div>
                {form.mode === 'custom' && (
                  <div className="mt-6 flex max-w-[280px] items-baseline gap-2">
                    <span className="font-mono text-[26px] tabular-nums text-ink-30">£</span>
                    <input
                      type="number"
                      min={10}
                      max={2500}
                      step={1}
                      className={`${inputBase} font-mono tabular-nums`}
                      style={{ fontSize: 26, borderBottomColor: 'var(--ink)' }}
                      value={form.custom}
                      onChange={(e) => onChange('custom', e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                )}
                <p className="mt-4 text-[12px] text-ink-30">Minimum £10. Maximum £2,500 per card.</p>
              </div>

              {/* Recipient */}
              <div className="mb-12">
                <div className="bav-label mb-[18px] text-ink-60">— Recipient</div>
                <div className="grid gap-7">
                  <FieldWrap id="recipientName" label="Recipient's name">
                    <input
                      id="recipientName"
                      className={inputBase}
                      value={form.recipientName}
                      onChange={(e) => onChange('recipientName', e.target.value)}
                      required
                    />
                  </FieldWrap>
                  <FieldWrap id="recipientEmail" label="Recipient's email">
                    <input
                      id="recipientEmail"
                      type="email"
                      className={inputBase}
                      value={form.recipientEmail}
                      onChange={(e) => onChange('recipientEmail', e.target.value)}
                      required
                    />
                  </FieldWrap>
                  <FieldWrap id="senderName" label="From">
                    <input
                      id="senderName"
                      className={inputBase}
                      value={form.senderName}
                      onChange={(e) => onChange('senderName', e.target.value)}
                      placeholder="Your name as it appears on the card"
                      required
                    />
                  </FieldWrap>
                </div>
              </div>

              {/* Message */}
              <div className="mb-12">
                <div className="bav-label mb-[18px] text-ink-60">— Message (optional)</div>
                <textarea
                  className="w-full resize-y border border-ink-10 bg-transparent p-4 text-[14px] leading-[1.55] text-ink outline-none transition-colors focus:border-ink"
                  style={{ minHeight: 120 }}
                  maxLength={240}
                  value={form.message}
                  onChange={(e) => onChange('message', e.target.value)}
                  placeholder="Keep it short. A line or two reads best."
                />
                <div className="mt-[6px] text-right font-mono text-[11px] tabular-nums text-ink-30">
                  {form.message.length} / 240
                </div>
              </div>

              {/* Delivery */}
              <div className="mb-14">
                <div className="bav-label mb-[18px] text-ink-60">— Delivery</div>
                <div className="flex gap-0">
                  <SendModeTab
                    active={form.sendMode === 'now'}
                    onClick={() => onChange('sendMode', 'now' as SendMode)}
                  >
                    Send now
                  </SendModeTab>
                  <SendModeTab
                    active={form.sendMode === 'schedule'}
                    onClick={() => onChange('sendMode', 'schedule' as SendMode)}
                    leftBorderless
                  >
                    Pick a date
                  </SendModeTab>
                </div>
                {form.sendMode === 'schedule' && (
                  <div className="mt-5 flex max-w-[280px] flex-col gap-2">
                    <label htmlFor="sendDate" className="bav-label text-ink-60">
                      Deliver on
                    </label>
                    <input
                      id="sendDate"
                      type="date"
                      className={`${inputBase} font-mono tabular-nums`}
                      value={form.sendDate}
                      onChange={(e) => onChange('sendDate', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Summary + CTA */}
              <div className="mb-6 flex items-baseline justify-between border-t border-ink-10 pt-6">
                <span className="bav-label text-ink-60">Total</span>
                <span className="font-mono text-[22px] tabular-nums text-ink">
                  {effectiveAmount
                    ? `£${Number(effectiveAmount).toLocaleString('en-GB')}.00`
                    : '£0.00'}
                </span>
              </div>

              <button
                type="submit"
                className="bav-cta"
                disabled={submitting || !effectiveAmount || effectiveAmount < 10}
              >
                {submitting ? 'Taking you to payment' : 'Buy gift card'}
              </button>
              <p className="mt-[14px] text-[12px] leading-[1.5] text-ink-30">
                Payment via Stripe. No VAT is charged on the card itself; VAT applies on the items it&rsquo;s
                redeemed against.
              </p>
            </div>
          </div>
        </form>

        {/* FAQ */}
        <section className="mt-32 grid grid-cols-1 gap-12 border-t border-ink-10 pt-16 md:grid-cols-[5fr_7fr] md:gap-20">
          <div>
            <div className="bav-label mb-[18px] text-ink-60">— Questions</div>
            <h2 className="m-0 font-display text-[clamp(36px,4.5vw,56px)] font-light leading-[1.05] tracking-[-0.01em]">
              What you might <span className="bav-italic">ask</span>.
            </h2>
          </div>
          <div>
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="border-b border-ink-10"
                style={{ borderTop: i === 0 ? '1px solid var(--ink-10)' : undefined }}
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6">
                  <span className="font-display text-[20px] font-normal tracking-[-0.005em] text-ink">
                    {f.q}
                  </span>
                  <span
                    className="font-mono text-[16px] tabular-nums text-ink-60 transition-transform"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="max-w-[640px] pb-6 text-[14px] leading-[1.65] text-ink-60">{f.a}</div>
              </details>
            ))}
            <p className="mt-8 text-[13px] text-ink-60">
              Still curious? Read the full{' '}
              <Link href="/terms#gift-cards" className="bav-underline text-ink no-underline">
                <span>gift card terms</span>
              </Link>{' '}
              or{' '}
              <Link href="/support" className="bav-underline text-ink no-underline">
                <span>email support</span>
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FieldWrap({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="bav-label text-ink-60">
        {label}
      </label>
      {children}
    </div>
  );
}

function SendModeTab({
  active,
  onClick,
  children,
  leftBorderless,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  leftBorderless?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 cursor-pointer border border-ink-10 py-[14px] text-[12px] tracking-[0.02em] transition-all"
      style={{
        borderLeft: leftBorderless ? 'none' : undefined,
        background: active ? 'var(--paper-2)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-60)',
        borderColor: active ? 'var(--ink)' : 'var(--ink-10)',
      }}
    >
      {children}
    </button>
  );
}
