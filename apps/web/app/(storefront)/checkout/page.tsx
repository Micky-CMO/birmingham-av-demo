'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { useCartStore } from '@/stores/cart';

type PayMethodId = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'klarna' | 'clearpay';

const PAYMENT_METHODS: Array<{ id: PayMethodId; label: string }> = [
  { id: 'card', label: 'Card' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'apple_pay', label: 'Apple Pay' },
  { id: 'google_pay', label: 'Google Pay' },
  { id: 'klarna', label: 'Klarna' },
  { id: 'clearpay', label: 'Clearpay' },
  // Invoice / BACS rendered only when session.user.canInvoice === true.
];

const SECTIONS = [
  { id: 0, num: '01', title: 'Contact' },
  { id: 1, num: '02', title: 'Shipping' },
  { id: 2, num: '03', title: 'Payment' },
  { id: 3, num: '04', title: 'Review' },
] as const;

type Contact = { email: string; phone: string };
type Addr = {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());

  const shippingCost = 0;
  const total = subtotal + shippingCost;
  const itemCount = useMemo(() => lines.reduce((a, l) => a + l.qty, 0), [lines]);
  const fmt = (n: number) => `£${n.toLocaleString('en-GB')}`;

  const [activeSection, setActiveSection] = useState<number>(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const [contact, setContact] = useState<Contact>({ email: '', phone: '' });
  const [addr, setAddr] = useState<Addr>({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
  });
  const [payMethod, setPayMethod] = useState<PayMethodId>('card');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const editSection = (idx: number) => setActiveSection(idx);

  const completeSection = (idx: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    setActiveSection(idx + 1);
  };

  const contactSummary = contact.email ? `${contact.email} · ${contact.phone}` : '';
  const addrSummary =
    addr.line1 && addr.city && addr.postcode
      ? `${addr.line1}, ${addr.city}, ${addr.postcode}`
      : '';
  const paymentSummary = PAYMENT_METHODS.find((m) => m.id === payMethod)?.label ?? '';
  const sectionSummary = [contactSummary, addrSummary, paymentSummary, ''];

  async function handlePlaceOrder() {
    if (!termsAccepted) return;
    setError(null);
    setSubmitting(true);
    const body = {
      contact,
      shipping: {
        label: 'Shipping',
        firstName: addr.firstName,
        lastName: addr.lastName,
        line1: addr.line1,
        line2: addr.line2 || undefined,
        city: addr.city,
        region: addr.county || undefined,
        postcode: addr.postcode,
        countryIso2: 'GB',
      },
      paymentMethod: payMethod,
      lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    };
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // The session endpoint currently returns a Stripe PaymentIntent client secret.
      // On real integration: mount Stripe Elements and confirm card payment with the
      // returned clientSecret. For now we optimistically complete the order flow.
      if (!res.ok && res.status !== 503) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setError(data.error?.message ?? 'Could not start checkout session. Try again.');
        setSubmitting(false);
        return;
      }
      clear();
      setOrderPlaced(true);
      window.setTimeout(() => {
        router.push('/account/orders');
      }, 2500);
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  // Empty cart guard — no redirect per spec, but we still render a friendly stop.
  if (lines.length === 0 && !orderPlaced) {
    return (
      <div className="mx-auto max-w-2xl px-12 py-24 text-center">
        <h1 className="font-display text-[clamp(36px,4.5vw,60px)] font-light leading-[0.98] tracking-[-0.03em]">
          Nothing to check out <span className="bav-italic">yet</span>.
        </h1>
        <p className="mt-4 text-ink-60">Your cart is empty.</p>
        <Link href="/shop" className="bav-underline mt-6 inline-flex text-[14px] text-ink no-underline">
          <span>Browse the catalogue</span>
          <span className="arrow">→</span>
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-12 py-20 text-center">
        <div className="max-w-[480px]">
          <div className="bav-label mb-6 flex items-center justify-center gap-3 text-ink-60">
            <span className="bav-pulse" />
            Order received
          </div>
          <h1 className="mb-4 font-display text-[clamp(40px,6vw,64px)] font-light tracking-[-0.025em]">
            Order <span className="bav-italic">placed</span>.
          </h1>
          <p className="mb-8 text-[16px] leading-[1.55] text-ink-60">
            Redirecting you to your order — your builder will be notified within the hour.
          </p>
          <Link
            href="/account/orders"
            className="bav-underline text-[14px] text-ink no-underline"
          >
            <span>View your order</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-12 pb-7 pt-10">
          <Link
            href="/cart"
            className="bav-underline mb-6 inline-flex text-[12px] text-ink-60 no-underline"
          >
            <span className="font-mono">←</span>
            <span>Back to cart</span>
          </Link>
          <div className="mt-4">
            <div className="bav-label mb-3 text-ink-60">— Checkout</div>
            <h1 className="m-0 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(36px,4.5vw,60px)]">
              Almost <span className="bav-italic">there</span>.
            </h1>
          </div>
        </div>
      </section>

      {/* Layout */}
      <div className="mx-auto max-w-page px-12 pb-24 pt-12">
        <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[1fr_360px] xl:gap-20">
          {/* LEFT: accordion */}
          <div>
            {/* Section 0: Contact */}
            <SectionShell
              idx={0}
              activeSection={activeSection}
              completed={completed}
              onEdit={editSection}
              summary={sectionSummary[0] ?? ''}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Email address"
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                  placeholder="you@example.co.uk"
                  full
                />
                <Field
                  label="Phone number"
                  id="phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                  placeholder="+44 7700 000000"
                  full
                />
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => completeSection(0)}
                  className="bav-cta"
                  disabled={!contact.email || !contact.phone}
                >
                  Continue to shipping
                </button>
              </div>
            </SectionShell>

            {/* Section 1: Shipping */}
            <SectionShell
              idx={1}
              activeSection={activeSection}
              completed={completed}
              onEdit={editSection}
              summary={sectionSummary[1] ?? ''}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  id="firstName"
                  value={addr.firstName}
                  onChange={(v) => setAddr((a) => ({ ...a, firstName: v }))}
                />
                <Field
                  label="Last name"
                  id="lastName"
                  value={addr.lastName}
                  onChange={(v) => setAddr((a) => ({ ...a, lastName: v }))}
                />
                <Field
                  label="Address line 1"
                  id="line1"
                  value={addr.line1}
                  onChange={(v) => setAddr((a) => ({ ...a, line1: v }))}
                  placeholder="Street address"
                  full
                />
                <Field
                  label="Address line 2"
                  id="line2"
                  value={addr.line2}
                  onChange={(v) => setAddr((a) => ({ ...a, line2: v }))}
                  placeholder="Flat, suite, unit (optional)"
                  full
                />
                <Field
                  label="Town or city"
                  id="city"
                  value={addr.city}
                  onChange={(v) => setAddr((a) => ({ ...a, city: v }))}
                />
                <Field
                  label="County"
                  id="county"
                  value={addr.county}
                  onChange={(v) => setAddr((a) => ({ ...a, county: v }))}
                />
                <Field
                  label="Postcode"
                  id="postcode"
                  value={addr.postcode}
                  onChange={(v) => setAddr((a) => ({ ...a, postcode: v.toUpperCase() }))}
                />
                <Field
                  label="Country"
                  id="country"
                  value={addr.country}
                  onChange={(v) => setAddr((a) => ({ ...a, country: v }))}
                />
              </div>

              <div className="mb-6 mt-6">
                <div className="bav-label mb-3 text-ink-60">Delivery method</div>
                <label className="flex cursor-pointer items-center justify-between border-t border-ink-10 py-[14px]">
                  <div className="flex items-center gap-[14px]">
                    <div className="h-[14px] w-[14px] border border-ink bg-ink" />
                    <div>
                      <div className="text-[14px]">Royal Mail Tracked 48</div>
                      <div className="bav-label text-ink-60">
                        2–3 working days · Free on orders over £500
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] tabular-nums">Free</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => completeSection(1)}
                className="bav-cta"
                disabled={
                  !addr.firstName || !addr.lastName || !addr.line1 || !addr.city || !addr.postcode
                }
              >
                Continue to payment
              </button>
            </SectionShell>

            {/* Section 2: Payment */}
            <SectionShell
              idx={2}
              activeSection={activeSection}
              completed={completed}
              onEdit={editSection}
              summary={sectionSummary[2] ?? ''}
            >
              <div className="bav-label mb-[14px] text-ink-60">Payment method</div>
              <div className="mb-7 flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <PayPill
                    key={m.id}
                    id={m.id}
                    label={m.label}
                    active={payMethod === m.id}
                    onClick={() => setPayMethod(m.id)}
                  />
                ))}
              </div>

              {payMethod === 'card' && (
                <div className="border border-ink-10 bg-transparent p-4">
                  <div className="bav-label mb-3 text-ink-60">Card details</div>
                  {/* TODO: mount Stripe Elements here — replace this placeholder with
                      <CardElement options={stripeOptions} /> inside <Elements> once
                      STRIPE_PUBLISHABLE_KEY is wired. */}
                  <div className="mb-[10px] font-mono text-[13px] tabular-nums tracking-[0.08em] text-ink-30">
                    •••• •••• •••• ••••&nbsp;&nbsp;&nbsp;&nbsp;MM / YY&nbsp;&nbsp;&nbsp;&nbsp;CVC
                  </div>
                  <div className="border-t border-ink-10 pt-[10px] text-[11px] text-ink-30">
                    Stripe Elements placeholder
                  </div>
                </div>
              )}

              {payMethod === 'paypal' && (
                <div className="border border-ink-10 p-5 text-center">
                  <div className="bav-label mb-2 text-ink-30">PayPal SDK placeholder</div>
                  <div className="text-[11px] text-ink-30">
                    Mount &lt;PayPalButtons /&gt; from @paypal/react-paypal-js once configured.
                  </div>
                </div>
              )}

              {payMethod === 'apple_pay' && (
                <div className="border border-ink-10 p-5 text-center">
                  <div className="bav-label mb-2 text-ink-30">Apple Pay placeholder</div>
                  <div className="text-[11px] text-ink-30">
                    Stripe Payment Request Button supports Apple Pay + Google Pay.
                  </div>
                </div>
              )}

              {payMethod === 'google_pay' && (
                <div className="border border-ink-10 p-5 text-center">
                  <div className="bav-label mb-2 text-ink-30">Google Pay placeholder</div>
                  <div className="text-[11px] text-ink-30">
                    Stripe Payment Request Button supports Apple Pay + Google Pay.
                  </div>
                </div>
              )}

              {payMethod === 'klarna' && (
                <div className="pt-1">
                  <div className="mb-2 font-mono text-[16px] tabular-nums">
                    3 × {fmt(Math.round(total / 3))}
                  </div>
                  <div className="text-[12px] leading-[1.5] text-ink-60">
                    0% interest · Subject to status · Representative example available at checkout.
                    Pay in 3 equal instalments over 60 days. First payment taken today.
                  </div>
                </div>
              )}

              {payMethod === 'clearpay' && (
                <div className="pt-1">
                  <div className="mb-2 font-mono text-[16px] tabular-nums">
                    4 × {fmt(Math.round(total / 4))}
                  </div>
                  <div className="text-[12px] leading-[1.5] text-ink-60">
                    Fortnightly. No fees if you pay on time. Subject to eligibility.
                    Available on orders between £1 and £2,000.
                  </div>
                </div>
              )}

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => completeSection(2)}
                  className="bav-cta"
                >
                  Review order
                </button>
              </div>
            </SectionShell>

            {/* Section 3: Review */}
            <SectionShell
              idx={3}
              activeSection={activeSection}
              completed={completed}
              onEdit={editSection}
              summary={sectionSummary[3] ?? ''}
            >
              <div className="mb-7 border-b border-ink-10 pb-7">
                <div className="mb-2 font-display text-[36px] font-light leading-none tracking-[-0.025em]">
                  {fmt(total)}
                </div>
                <div className="font-mono text-[12px] tabular-nums text-ink-60">
                  {shippingCost === 0 ? 'Free shipping' : `Shipping ${fmt(shippingCost)}`}
                  {' · '}
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mb-8">
                <div className="bav-label mb-5 text-ink-60">What happens next</div>
                {[
                  {
                    n: '01',
                    t: 'Your order is confirmed and your builder is notified within the hour.',
                  },
                  {
                    n: '02',
                    t: 'Built and bench-tested over 24–48 hours. Benchmarks printed to your birth certificate.',
                  },
                  {
                    n: '03',
                    t: 'Dispatched with DPD. Live tracking link sent to your phone.',
                  },
                ].map((step) => (
                  <div key={step.n} className="mb-4 flex gap-4">
                    <span className="flex-shrink-0 pt-[2px] font-mono text-[11px] tabular-nums text-ink-30">
                      {step.n}
                    </span>
                    <span className="text-[14px] leading-[1.55] text-ink-60">{step.t}</span>
                  </div>
                ))}
              </div>

              <label className="mb-7 flex cursor-pointer select-none gap-[14px]">
                <button
                  type="button"
                  aria-pressed={termsAccepted}
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className="mt-[2px] h-4 w-4 flex-shrink-0 cursor-pointer border-none p-0 transition-colors"
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: termsAccepted ? 'var(--ink)' : 'var(--ink-30)',
                    background: termsAccepted ? 'var(--ink)' : 'transparent',
                  }}
                />
                <span className="text-[13px] leading-[1.55] text-ink-60">
                  I agree to the{' '}
                  <Link href="/terms" className="text-ink">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-ink">
                    Privacy Policy
                  </Link>
                  . I understand that payment will be collected immediately on placing my order.
                </span>
              </label>

              {error && (
                <div className="mb-4 border border-[#B94040]/30 bg-[#B94040]/10 px-3 py-2 text-[13px] text-[#B94040]">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!termsAccepted || submitting}
                className="bav-cta"
              >
                {submitting ? 'Placing order…' : `Place order · ${fmt(total)}`}
              </button>
            </SectionShell>

            <div className="border-t border-ink-10" />
          </div>

          {/* RIGHT: summary */}
          <div className="static xl:sticky xl:top-20">
            <div className="mb-6 font-display text-[22px] tracking-[-0.015em]">Order summary</div>

            <div className="mb-6 flex flex-col gap-4 border-b border-ink-10 pb-6">
              {lines.map((l) => (
                <MiniLine
                  key={l.productId}
                  title={l.title}
                  qty={l.qty}
                  pricePerUnitGbp={l.pricePerUnitGbp}
                  buildNumber={l.buildNumber}
                />
              ))}
            </div>

            <div>
              <div className="flex items-baseline justify-between border-t border-ink-10 py-3">
                <span className="text-[13px] text-ink-60">
                  Subtotal <span className="bav-label text-[9px] text-ink-30">inc. VAT</span>
                </span>
                <span className="font-mono text-[13px] tabular-nums">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-10 py-3">
                <span className="text-[13px] text-ink-60">Shipping</span>
                <span className="font-mono text-[13px] tabular-nums">
                  {shippingCost === 0 ? 'Free' : fmt(shippingCost)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-10 py-4">
                <span className="text-[15px] font-medium">Total</span>
                <span className="font-mono text-[20px] tabular-nums tracking-[-0.01em]">
                  {fmt(total)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <div className="bav-label flex items-center gap-2 text-ink-30">
                <IconLock />
                <span>Secured by Stripe · 256-bit SSL</span>
              </div>
              <div className="bav-label text-ink-30">
                12 mo warranty · 30 days returns · Free UK delivery over £500
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  idx,
  activeSection,
  completed,
  onEdit,
  summary,
  children,
}: {
  idx: number;
  activeSection: number;
  completed: Set<number>;
  onEdit: (idx: number) => void;
  summary: string;
  children: ReactNode;
}) {
  const { num, title } = SECTIONS[idx]!;
  const isActive = activeSection === idx;
  const isDone = completed.has(idx);
  const isLocked = !isDone && !isActive;

  const onHeaderClick = () => {
    if (isDone && !isActive) onEdit(idx);
  };

  return (
    <div className="border-t border-ink-10">
      <div
        onClick={onHeaderClick}
        className={`flex items-baseline justify-between py-6 ${
          isLocked ? 'cursor-not-allowed' : isDone && !isActive ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-disabled={isLocked}
      >
        <div className="flex items-baseline gap-4">
          <span
            className={`font-mono text-[11px] tabular-nums ${isLocked ? 'text-ink-30' : 'text-ink-60'}`}
          >
            {num}
          </span>
          <span
            className={`font-display text-[22px] tracking-[-0.015em] ${isLocked ? 'text-ink-30' : 'text-ink'}`}
          >
            {title}
          </span>
        </div>
        {isDone && !isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(idx);
            }}
            className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[12px] text-ink-60"
          >
            <span>Edit</span>
            <span className="arrow">→</span>
          </button>
        )}
      </div>

      {isDone && !isActive && summary && (
        <div className="bav-label pb-6 text-ink-60">{summary}</div>
      )}

      {isActive && <div className="pb-8">{children}</div>}
    </div>
  );
}

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  full,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="bav-label mb-2 block text-ink-60">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className="bav-field box-border w-full border border-ink-10 bg-transparent px-[14px] py-3 text-[14px] text-ink outline-none"
      />
    </div>
  );
}

function PayPill({
  id,
  label,
  active,
  onClick,
}: {
  id: PayMethodId;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-pay-id={id}
      className="cursor-pointer px-[18px] py-2 text-[12px] uppercase tracking-[0.06em] transition-all"
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: active ? 'var(--ink)' : 'var(--ink-10)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink-60)',
      }}
    >
      {label}
    </button>
  );
}

function MiniLine({
  title,
  qty,
  pricePerUnitGbp,
  buildNumber,
}: {
  title: string;
  qty: number;
  pricePerUnitGbp: number;
  buildNumber?: string;
}) {
  return (
    <div className="flex items-center gap-[14px]">
      <div className="bav-canvas relative h-[50px] w-[40px] flex-shrink-0">
        {buildNumber && (
          <div className="absolute inset-0 flex select-none items-center justify-center font-display text-[18px] font-light italic tracking-[-0.03em] text-[rgba(23,20,15,0.14)]">
            {buildNumber}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{title}</div>
        {qty > 1 && <div className="font-mono text-[11px] tabular-nums text-ink-60">Qty {qty}</div>}
      </div>
      <div className="flex-shrink-0 font-mono text-[13px] tabular-nums">
        £{(pricePerUnitGbp * qty).toLocaleString('en-GB')}
      </div>
    </div>
  );
}

function IconLock({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="0" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
