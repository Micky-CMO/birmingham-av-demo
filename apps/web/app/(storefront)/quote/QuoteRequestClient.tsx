'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type Row = { qty: string; spec: string };
type Mode = 'rows' | 'freeform';
type SendMode = Mode;

type FormState = {
  company: string;
  vatNumber: string;
  contactName: string;
  email: string;
  phone: string;
  mode: Mode;
  freeform: string;
  rows: Row[];
  neededBy: string;
  shipAddress: string;
  multipleShips: boolean;
  budgetGbp: string;
  notes: string;
};

const INITIAL: FormState = {
  company: '',
  vatNumber: '',
  contactName: '',
  email: '',
  phone: '',
  mode: 'rows',
  freeform: '',
  rows: [{ qty: '1', spec: '' }],
  neededBy: '',
  shipAddress: '',
  multipleShips: false,
  budgetGbp: '',
  notes: '',
};

const inputBase =
  'bg-transparent border-0 border-b border-ink-10 px-0 py-[10px] pb-3 text-[14px] text-ink outline-none transition-colors focus:border-ink';

const textareaBase =
  'w-full resize-y border border-ink-10 bg-transparent p-4 text-[14px] leading-[1.55] text-ink outline-none transition-colors focus:border-ink';

export function QuoteRequestClient() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ quoteNumber: string } | null>(null);
  const [error, setError] = useState('');

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setForm((f) => ({
      ...f,
      rows: f.rows.map((r, ri) => (ri === i ? { ...r, ...patch } : r)),
    }));
  }
  function addRow() {
    setForm((f) => ({ ...f, rows: [...f.rows, { qty: '1', spec: '' }] }));
  }
  function removeRow(i: number) {
    setForm((f) => ({ ...f, rows: f.rows.filter((_, ri) => ri !== i) }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rows: form.mode === 'rows'
          ? form.rows
              .filter((r) => r.spec.trim().length > 0)
              .map((r) => ({ qty: Number(r.qty) || 1, spec: r.spec.trim() }))
          : undefined,
        freeform: form.mode === 'freeform' ? form.freeform : undefined,
        neededBy: form.neededBy || undefined,
        budgetGbp: form.budgetGbp || undefined,
      };
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        quoteNumber?: string;
        error?: { message?: string };
      };
      if (!res.ok || !data.quoteNumber) {
        setError(data.error?.message ?? 'Could not send the enquiry. Try again.');
        setSubmitting(false);
        return;
      }
      setSent({ quoteNumber: data.quoteNumber });
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-12 pb-32 pt-20">
        {sent ? (
          <div className="bav-fade mx-auto mt-20 max-w-[720px] text-left">
            <div className="bav-label mb-6 text-ink-60">— Received</div>
            <h1 className="m-0 font-display text-[clamp(42px,5.5vw,72px)] font-light leading-[1.02] tracking-[-0.02em]">
              Thank you. We&rsquo;ll be in <span className="bav-italic">touch</span>.
            </h1>
            <p className="mt-8 max-w-[560px] text-[16px] leading-[1.65] text-ink-60">
              Your enquiry has been logged. An account manager will review the brief and reply by email
              within one working day. Reference:{' '}
              <span className="font-mono tabular-nums text-ink">{sent.quoteNumber}</span>.
            </p>
            <div className="mt-10 flex gap-6">
              <Link href="/shop" className="bav-underline text-[13px] text-ink no-underline">
                <span>Continue browsing</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bav-fade grid grid-cols-1 gap-12 md:grid-cols-[5fr_7fr] md:gap-20">
            {/* LEFT — editorial intro */}
            <div>
              <div className="bav-label mb-8 text-ink-60">— Trade enquiry</div>
              <h1 className="m-0 font-display text-[clamp(48px,6vw,84px)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
                Request a <span className="bav-italic">quote</span>.
              </h1>
              <p className="mt-8 max-w-[460px] text-[16px] leading-[1.65] text-ink-60">
                For orders above five units, bespoke builds, bulk refurbs, fleet rollouts, or anything that
                needs a human to sanity-check before invoicing. Write what you want, when you need it, and
                where it&rsquo;s going.
              </p>
              <p className="mt-5 max-w-[460px] text-[14px] leading-[1.65] text-ink-60">
                An account manager reads every enquiry personally. Expect a reply within one working day with
                pricing, lead times and, where it makes sense, a small reduction for volume.
              </p>

              <div className="mt-12 border-t border-ink-10 pt-6">
                <div className="bav-label mb-3 text-ink-30">— What happens next</div>
                <ol className="m-0 list-none p-0 text-[13px] leading-[1.7] text-ink-60">
                  {[
                    'We acknowledge your enquiry within the hour, during working hours.',
                    'A builder costs the spec, confirms availability, flags anything unusual.',
                    'You receive a fixed-price quote valid for fourteen days. Accept it and we begin.',
                  ].map((text, i) => (
                    <li
                      key={i}
                      className="grid gap-3 border-b border-ink-10 py-3 last:border-b-0"
                      style={{ gridTemplateColumns: '32px 1fr' }}
                    >
                      <span className="bav-italic font-display text-[16px] text-ink-30">
                        №{String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-10 border border-ink-10 bg-paper-2 p-5">
                <div className="bav-label mb-2 text-ink-60">— Already a trade customer?</div>
                <p className="m-0 mb-3 text-[13px] leading-[1.55] text-ink-60">
                  Sign in and we&rsquo;ll prefill the company block for you.
                </p>
                <Link
                  href="/auth/login?next=/quote"
                  className="bav-underline text-[13px] text-ink no-underline"
                >
                  <span>Sign in</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            {/* RIGHT — form */}
            <form onSubmit={onSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  className="mb-6 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
                >
                  {error}
                </div>
              )}

              {/* Who's asking */}
              <div className="mb-14">
                <div className="bav-label mb-6 text-ink-60">— Who&rsquo;s asking</div>
                <div className="grid gap-7">
                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-[1.4fr_1fr]">
                    <FieldWrap id="company" label="Company name">
                      <input
                        id="company"
                        className={inputBase}
                        value={form.company}
                        onChange={(e) => onChange('company', e.target.value)}
                        required
                      />
                    </FieldWrap>
                    <FieldWrap id="vatNumber" label="VAT number (optional)">
                      <input
                        id="vatNumber"
                        className={`${inputBase} font-mono tabular-nums`}
                        value={form.vatNumber}
                        onChange={(e) => onChange('vatNumber', e.target.value)}
                        placeholder="GB"
                      />
                    </FieldWrap>
                  </div>
                  <FieldWrap id="contactName" label="Your name">
                    <input
                      id="contactName"
                      className={inputBase}
                      value={form.contactName}
                      onChange={(e) => onChange('contactName', e.target.value)}
                      required
                    />
                  </FieldWrap>
                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-[1.4fr_1fr]">
                    <FieldWrap id="email" label="Work email">
                      <input
                        id="email"
                        type="email"
                        className={inputBase}
                        value={form.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        required
                      />
                    </FieldWrap>
                    <FieldWrap id="phone" label="Phone">
                      <input
                        id="phone"
                        className={`${inputBase} font-mono tabular-nums`}
                        value={form.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        placeholder="+44 "
                        required
                      />
                    </FieldWrap>
                  </div>
                </div>
              </div>

              {/* What you want */}
              <div className="mb-14">
                <div className="mb-[18px] flex items-baseline justify-between">
                  <div className="bav-label text-ink-60">— What you want</div>
                  <div className="flex">
                    <ModeTab
                      active={form.mode === 'rows'}
                      onClick={() => onChange('mode', 'rows' as Mode)}
                    >
                      Rows
                    </ModeTab>
                    <ModeTab
                      active={form.mode === 'freeform'}
                      onClick={() => onChange('mode', 'freeform' as Mode)}
                      leftBorderless
                    >
                      Free text
                    </ModeTab>
                  </div>
                </div>

                {form.mode === 'rows' ? (
                  <div>
                    <RowGrid header>
                      <span className="bav-label text-ink-30">Qty</span>
                      <span className="bav-label text-ink-30">Specification</span>
                      <span />
                    </RowGrid>
                    {form.rows.map((row, i) => (
                      <RowGrid key={i}>
                        <input
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) => updateRow(i, { qty: e.target.value })}
                          className={`${inputBase} font-mono tabular-nums pb-[6px]`}
                        />
                        <input
                          value={row.spec}
                          onChange={(e) => updateRow(i, { spec: e.target.value })}
                          placeholder="e.g. Aegis Ultra · Ryzen 9 9950X3D · RTX 5090 · 64GB · 2TB NVMe"
                          className={`${inputBase} pb-[6px]`}
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          disabled={form.rows.length === 1}
                          aria-label="Remove row"
                          className="border-0 bg-transparent p-1 text-[18px] text-ink-30 disabled:cursor-not-allowed"
                          style={{ cursor: form.rows.length === 1 ? 'not-allowed' : 'pointer' }}
                        >
                          ×
                        </button>
                      </RowGrid>
                    ))}
                    <button
                      type="button"
                      onClick={addRow}
                      className="bav-underline mt-[18px] border-0 bg-transparent p-0 text-[12px] text-ink-60"
                    >
                      <span>Add another row</span>
                      <span className="arrow">+</span>
                    </button>
                  </div>
                ) : (
                  <textarea
                    className={textareaBase}
                    style={{ minHeight: 140 }}
                    value={form.freeform}
                    onChange={(e) => onChange('freeform', e.target.value)}
                    placeholder="Describe the items you need. Include any specs you care about, fleet sizes, existing kit we'd be matching, deadlines."
                  />
                )}
              </div>

              {/* When you need it */}
              <div className="mb-14">
                <div className="bav-label mb-6 text-ink-60">— When you need it</div>
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                  <FieldWrap id="neededBy" label="Needed by">
                    <input
                      id="neededBy"
                      type="date"
                      className={`${inputBase} font-mono tabular-nums`}
                      value={form.neededBy}
                      onChange={(e) => onChange('neededBy', e.target.value)}
                    />
                  </FieldWrap>
                  <FieldWrap id="budgetGbp" label="Budget indicator (optional)">
                    <input
                      id="budgetGbp"
                      className={`${inputBase} font-mono tabular-nums`}
                      value={form.budgetGbp}
                      onChange={(e) => onChange('budgetGbp', e.target.value)}
                      placeholder="£"
                    />
                  </FieldWrap>
                </div>
              </div>

              {/* Where to ship */}
              <div className="mb-14">
                <div className="bav-label mb-6 text-ink-60">— Where to ship</div>
                <FieldWrap id="shipAddress" label="Shipping address(es)">
                  <textarea
                    id="shipAddress"
                    className={textareaBase}
                    style={{ minHeight: 100 }}
                    value={form.shipAddress}
                    onChange={(e) => onChange('shipAddress', e.target.value)}
                    placeholder="One address per line if splitting the delivery."
                  />
                </FieldWrap>
                <label className="mt-[14px] flex cursor-pointer items-center gap-[10px] text-[13px] text-ink-60">
                  <input
                    type="checkbox"
                    checked={form.multipleShips}
                    onChange={(e) => onChange('multipleShips', e.target.checked)}
                    className="accent-ink"
                  />
                  Split across multiple sites
                </label>
              </div>

              {/* Notes */}
              <div className="mb-14">
                <div className="bav-label mb-6 text-ink-60">— Anything else</div>
                <FieldWrap id="notes" label="Notes">
                  <textarea
                    id="notes"
                    className={textareaBase}
                    style={{ minHeight: 120 }}
                    value={form.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Existing fleet, finance constraints, asset-tagging preferences, install dates."
                  />
                </FieldWrap>
              </div>

              <button type="submit" className="bav-cta" disabled={submitting}>
                {submitting ? 'Sending' : 'Send enquiry'}
              </button>
              <p className="mt-4 text-[12px] leading-[1.5] text-ink-30">
                By sending you agree to our{' '}
                <Link href="/terms" className="bav-hover-opa text-ink-60">
                  terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="bav-hover-opa text-ink-60">
                  privacy policy
                </Link>
                . No data is shared with third parties.
              </p>
            </form>
          </div>
        )}
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

function ModeTab({
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
      className="cursor-pointer border border-ink-10 px-4 py-[10px] text-[12px] tracking-[0.02em] transition-all"
      style={{
        background: active ? 'var(--paper-2)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-60)',
        borderColor: active ? 'var(--ink)' : 'var(--ink-10)',
        borderLeft: leftBorderless ? 'none' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function RowGrid({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: boolean;
}) {
  return (
    <div
      className="grid items-center gap-4 border-b border-ink-10 py-[14px]"
      style={{
        gridTemplateColumns: '80px 1fr 32px',
        paddingTop: header ? 0 : undefined,
        paddingBottom: header ? 10 : undefined,
      }}
    >
      {children}
    </div>
  );
}

// SendMode re-export to silence unused-export linters if any consumer imports.
export type { SendMode };
