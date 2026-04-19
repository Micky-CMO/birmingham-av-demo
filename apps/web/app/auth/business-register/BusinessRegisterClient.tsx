'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

function IconSearch() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h12l1 4H5l1-4Z" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

/**
 * Minimal auth-shell nav. Mirrors /auth/login so the two pages share
 * rhythm — the auth segment sits outside the (storefront) shell.
 */
function AuthNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ink-10 bg-paper">
      <div className="bav-nav-inner mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-6 px-12">
        <Link
          href="/"
          className="font-display text-[19px] tracking-[-0.015em] text-ink no-underline"
        >
          Birmingham AV
        </Link>
        <div className="bav-nav-links flex gap-10 text-[13px]">
          {[
            { label: 'Shop', href: '/shop' },
            { label: 'Builders', href: '/builders' },
            { label: 'Journal', href: '/journal' },
            { label: 'Support', href: '/support' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="bav-hover-opa text-ink no-underline">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5 text-[13px]">
          <Link
            href="/search"
            aria-label="Search"
            className="bav-hover-opa bav-nav-desktop-util flex items-center text-ink no-underline"
          >
            <IconSearch />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="bav-hover-opa flex items-center gap-2 text-ink no-underline"
          >
            <IconBag />
            <span className="font-mono text-[12px] tabular-nums text-ink-60">(00)</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

const BENEFITS = [
  { label: 'Net 30 billing', body: 'Invoice on dispatch, pay in thirty days. No card surcharge.' },
  {
    label: 'Dedicated account manager',
    body: 'One named contact. Direct line. Replies within the working day.',
  },
  { label: 'Bulk pricing', body: 'Tiered discounts from five units. Custom quotes above twenty.' },
  {
    label: 'VAT invoice on dispatch',
    body: 'Itemised invoice with VAT breakdown in your inbox the moment the parcel leaves the workshop.',
  },
];

const SPEND_OPTIONS: Array<{ value: 'under_1k' | '1k_5k' | '5k_25k' | 'over_25k'; label: string }> = [
  { value: 'under_1k', label: 'Under £1,000' },
  { value: '1k_5k', label: '£1,000 — £5,000' },
  { value: '5k_25k', label: '£5,000 — £25,000' },
  { value: 'over_25k', label: 'Over £25,000' },
];

type FormState = {
  companyName: string;
  vatNumber: string;
  companyNumber: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingPostcode: string;
  billingCountry: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  monthlySpend: '' | 'under_1k' | '1k_5k' | '5k_25k' | 'over_25k';
  agree: boolean;
};

const INITIAL: FormState = {
  companyName: '',
  vatNumber: '',
  companyNumber: '',
  billingLine1: '',
  billingLine2: '',
  billingCity: '',
  billingPostcode: '',
  billingCountry: 'United Kingdom',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  monthlySpend: '',
  agree: false,
};

const inputBase =
  'bg-transparent border-0 border-b border-ink-10 px-0 py-[10px] pb-3 text-[14px] text-ink outline-none transition-colors focus:border-ink';

export function BusinessRegisterClient() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!form.agree || !form.monthlySpend) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/business-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        businessAccountId?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? 'Could not submit the application. Try again.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <AuthNav />

      <div className="mx-auto max-w-[1440px] px-12 pb-32 pt-20">
        {submitted ? (
          <div className="bav-fade mx-auto max-w-[640px] py-24 text-left">
            <div className="bav-label mb-6 text-ink-60">— Received</div>
            <h1 className="m-0 font-display text-[clamp(42px,5.5vw,72px)] font-light leading-[1.02] tracking-[-0.02em]">
              Thank you. We&rsquo;ll be in <span className="bav-italic">touch</span>.
            </h1>
            <p className="mt-8 max-w-[560px] text-[16px] leading-[1.65] text-ink-60">
              We&rsquo;ve logged your application. A member of our trade team will review within one working
              day and reply with approval, account-manager introduction and your initial credit limit.
            </p>
            <div className="mt-10 flex gap-6">
              <Link href="/" className="bav-underline text-[13px] text-ink no-underline">
                <span>Back to the shop</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bav-fade grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-[72px]">
            {/* LEFT — editorial */}
            <div className="flex min-h-[640px] flex-col justify-between">
              <div>
                <div className="bav-label mb-8 text-ink-60">— Trade accounts</div>
                <h1 className="m-0 font-display text-[clamp(48px,6.2vw,84px)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
                  Birmingham AV,
                  <br />
                  for <span className="bav-italic">business</span>.
                </h1>
                <p className="mt-8 max-w-[460px] text-[16px] leading-[1.6] text-ink-60">
                  Procurement for studios, agencies, post-production houses, schools, councils. We invoice on
                  dispatch, deliver on our own schedule, and you deal with a named human from the first email
                  to the final RMA.
                </p>
              </div>

              <div className="mt-16">
                {BENEFITS.map((b, i) => (
                  <div
                    key={b.label}
                    className="grid gap-4 border-t border-ink-10 py-[22px]"
                    style={{
                      gridTemplateColumns: '24px 1fr',
                      borderBottom: i === BENEFITS.length - 1 ? '1px solid var(--ink-10)' : undefined,
                    }}
                  >
                    <span className="bav-label text-ink-30">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="mb-1 text-[14px] font-medium text-ink">{b.label}</div>
                      <div className="text-[13px] leading-[1.55] text-ink-60">{b.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="bav-label mb-10 text-ink-60">— Apply</div>

              {error && (
                <div
                  role="alert"
                  className="mb-6 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
                >
                  {error}
                </div>
              )}

              {/* Company */}
              <div className="mb-12">
                <div className="mb-6 font-display text-[20px] text-ink">Company</div>
                <div className="grid gap-7">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="companyName" className="bav-label text-ink-60">
                      Company name
                    </label>
                    <input
                      id="companyName"
                      className={inputBase}
                      value={form.companyName}
                      onChange={(e) => onChange('companyName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="vatNumber" className="bav-label text-ink-60">
                        VAT number
                      </label>
                      <input
                        id="vatNumber"
                        className={`${inputBase} font-mono tabular-nums`}
                        value={form.vatNumber}
                        onChange={(e) => onChange('vatNumber', e.target.value)}
                        placeholder="GB123456789"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="companyNumber" className="bav-label text-ink-60">
                        Company no.
                      </label>
                      <input
                        id="companyNumber"
                        className={`${inputBase} font-mono tabular-nums`}
                        value={form.companyNumber}
                        onChange={(e) => onChange('companyNumber', e.target.value)}
                        placeholder="00000000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing address */}
              <div className="mb-12">
                <div className="mb-6 font-display text-[20px] text-ink">Billing address</div>
                <div className="grid gap-7">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="billingLine1" className="bav-label text-ink-60">
                      Address line 1
                    </label>
                    <input
                      id="billingLine1"
                      className={inputBase}
                      value={form.billingLine1}
                      onChange={(e) => onChange('billingLine1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="billingLine2" className="bav-label text-ink-60">
                      Address line 2 (optional)
                    </label>
                    <input
                      id="billingLine2"
                      className={inputBase}
                      value={form.billingLine2}
                      onChange={(e) => onChange('billingLine2', e.target.value)}
                    />
                  </div>
                  <div
                    className="grid grid-cols-1 gap-7 sm:grid-cols-[1.4fr_1fr]"
                  >
                    <div className="flex flex-col gap-2">
                      <label htmlFor="billingCity" className="bav-label text-ink-60">
                        City
                      </label>
                      <input
                        id="billingCity"
                        className={inputBase}
                        value={form.billingCity}
                        onChange={(e) => onChange('billingCity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="billingPostcode" className="bav-label text-ink-60">
                        Postcode
                      </label>
                      <input
                        id="billingPostcode"
                        className={`${inputBase} font-mono tabular-nums uppercase`}
                        value={form.billingPostcode}
                        onChange={(e) => onChange('billingPostcode', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="billingCountry" className="bav-label text-ink-60">
                      Country
                    </label>
                    <select
                      id="billingCountry"
                      className={`${inputBase} appearance-none pr-6`}
                      value={form.billingCountry}
                      onChange={(e) => onChange('billingCountry', e.target.value)}
                    >
                      <option>United Kingdom</option>
                      <option>Ireland</option>
                      <option>France</option>
                      <option>Germany</option>
                      <option>Netherlands</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary contact */}
              <div className="mb-12">
                <div className="mb-6 font-display text-[20px] text-ink">Primary contact</div>
                <div className="grid gap-7">
                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="firstName" className="bav-label text-ink-60">
                        First name
                      </label>
                      <input
                        id="firstName"
                        className={inputBase}
                        value={form.firstName}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lastName" className="bav-label text-ink-60">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        className={inputBase}
                        value={form.lastName}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="bav-label text-ink-60">
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={inputBase}
                      value={form.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="bav-label text-ink-60">
                      Phone
                    </label>
                    <input
                      id="phone"
                      className={`${inputBase} font-mono tabular-nums`}
                      value={form.phone}
                      onChange={(e) => onChange('phone', e.target.value)}
                      placeholder="+44 "
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Spend */}
              <div className="mb-12">
                <div className="mb-6 font-display text-[20px] text-ink">Volume</div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="monthlySpend" className="bav-label text-ink-60">
                    Estimated monthly spend
                  </label>
                  <select
                    id="monthlySpend"
                    className={`${inputBase} appearance-none pr-6`}
                    value={form.monthlySpend}
                    onChange={(e) => onChange('monthlySpend', e.target.value as FormState['monthlySpend'])}
                    required
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    {SPEND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consent */}
              <label className="mb-8 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => onChange('agree', e.target.checked)}
                  className="mt-1 accent-ink"
                  required
                />
                <span className="text-[13px] leading-[1.55] text-ink-60">
                  I confirm I&rsquo;m authorised to apply on behalf of this company, and I&rsquo;ve read the{' '}
                  <Link href="/terms" className="bav-underline text-ink no-underline">
                    <span>trade terms</span>
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                className="bav-cta"
                disabled={submitting || !form.agree || !form.monthlySpend}
              >
                {submitting ? 'Sending' : 'Apply for a trade account'}
              </button>

              <p className="mt-5 text-[12px] leading-[1.6] text-ink-30">
                We review applications within one working day. You&rsquo;ll receive an approval email with your
                account manager&rsquo;s direct contact.
              </p>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink-10 pt-6">
                <span className="text-[13px] text-ink-60">Not a business?</span>
                <Link href="/auth/register" className="bav-underline text-[13px] text-ink no-underline">
                  <span>Create a personal account</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
