'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';

const ITEM_TYPES = [
  { value: 'desktop', label: 'Desktop PC' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'allinone', label: 'All-in-One' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  {
    value: 'like-new',
    label: 'Like new',
    hint: 'Less than 12 months old, original box, no marks.',
  },
  {
    value: 'excellent',
    label: 'Excellent',
    hint: 'Under 3 years, light wear, fully working.',
  },
  {
    value: 'good',
    label: 'Good',
    hint: 'Signs of use, working, screen/chassis marks OK.',
  },
  {
    value: 'fair',
    label: 'Fair',
    hint: 'Heavy wear, may need repairs, we will still look.',
  },
  {
    value: 'not-working',
    label: 'Not working',
    hint: 'Dead, broken, or incomplete. Value is in parts.',
  },
];

const inputBase =
  'bg-transparent border-0 border-b border-ink-10 px-0 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-30';

export function TradeInClient() {
  const [itemType, setItemType] = useState('desktop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('excellent');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: 'ok'; reference: string; estimateGbp: number }
    | { kind: 'error'; message: string }
    | null
  >(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      contactName.trim() &&
        email.includes('@') &&
        brand.trim() &&
        model.trim() &&
        !submitting,
    );
  }, [contactName, email, brand, model, submitting]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/trade-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          brand,
          model,
          condition,
          contactName,
          email,
          phone: phone || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = await res.json();
      setResult({ kind: 'ok', reference: json.reference, estimateGbp: json.estimateGbp });
    } catch (err) {
      setResult({ kind: 'error', message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.kind === 'ok') {
    return (
      <section className="mx-auto max-w-page px-6 py-24 md:px-12 md:pt-32 md:pb-40">
        <div className="bav-fade max-w-[620px]">
          <div className="bav-label mb-14 text-ink-60">— Trade-in received</div>
          <h1 className="m-0 mb-12 font-display text-[clamp(56px,9vw,120px)] font-light leading-[0.95] tracking-[-0.035em]">
            Thank you, <span className="bav-italic">{contactName.split(' ')[0]}</span>.
          </h1>
          <p className="mb-8 text-[18px] leading-[1.6] text-ink-60">
            We will review the details and email a firm offer within two working days.
          </p>
          <div className="mb-8 border-t border-b border-ink-10 py-6">
            <div className="bav-label mb-3 text-ink-60">Provisional estimate</div>
            <div className="font-display text-[48px] font-light leading-none tracking-[-0.025em]">
              £{result.estimateGbp.toLocaleString('en-GB')}
            </div>
          </div>
          <div className="bav-label mb-10 font-mono text-ink-60">Reference · {result.reference}</div>
          <Link href="/" className="bav-underline text-[14px] text-ink no-underline">
            <span>Back to home</span>
            <span className="arrow font-mono">→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* HERO */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:pt-32 md:pb-32">
          <div className="bav-fade max-w-[640px]">
            <div className="bav-label mb-14 text-ink-60">— Trade-in</div>
            <h1 className="m-0 mb-10 font-display text-[clamp(56px,9vw,130px)] font-light leading-[0.95] tracking-[-0.035em]">
              Send us your <span className="bav-italic">old</span> one.
            </h1>
            <p className="text-[20px] leading-[1.5] text-ink-60">
              A cash offer or store credit for your old computer, laptop, or monitor.
              Free collection from anywhere in the UK. No obligation to accept the offer.
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="border-b border-ink-10 bg-paper-2">
        <div className="mx-auto grid max-w-page grid-cols-1 gap-16 px-6 py-24 md:grid-cols-[1fr_1.4fr] md:px-12 md:py-32">
          <div>
            <div className="bav-label mb-8 text-ink-60">— How it works</div>
            <ol className="m-0 list-none space-y-8 p-0">
              <li>
                <div className="bav-label mb-2 font-mono text-ink-30">01</div>
                <div className="mb-1.5 font-display text-[22px] tracking-[-0.015em]">
                  Tell us about it
                </div>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-60">
                  Brand, model, condition. A paragraph is fine.
                </p>
              </li>
              <li>
                <div className="bav-label mb-2 font-mono text-ink-30">02</div>
                <div className="mb-1.5 font-display text-[22px] tracking-[-0.015em]">
                  We send a firm offer
                </div>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-60">
                  Within two working days. No pressure, no auto-renewal.
                </p>
              </li>
              <li>
                <div className="bav-label mb-2 font-mono text-ink-30">03</div>
                <div className="mb-1.5 font-display text-[22px] tracking-[-0.015em]">
                  Free collection
                </div>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-60">
                  Royal Mail or DPD pickup, we cover it. Tracked + insured.
                </p>
              </li>
              <li>
                <div className="bav-label mb-2 font-mono text-ink-30">04</div>
                <div className="mb-1.5 font-display text-[22px] tracking-[-0.015em]">
                  Paid same day
                </div>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-60">
                  Once it lands on the bench and matches the description.
                </p>
              </li>
            </ol>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-8">
            <fieldset className="m-0 border-0 p-0">
              <legend className="bav-label mb-5 text-ink-60">— What are you sending</legend>
              <div className="flex flex-wrap gap-2">
                {ITEM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setItemType(t.value)}
                    aria-pressed={itemType === t.value}
                    className={`border px-4 py-2 text-[13px] transition-colors ${
                      itemType === t.value
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink-10 bg-transparent text-ink hover:border-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="bav-label mb-3 block text-ink-60" htmlFor="brand">
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  className={`${inputBase} w-full`}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Dell, HP, Apple"
                />
              </div>
              <div>
                <label className="bav-label mb-3 block text-ink-60" htmlFor="model">
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  className={`${inputBase} w-full`}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. XPS 15 9520, MBP 16-inch M2"
                />
              </div>
            </div>

            <fieldset className="m-0 border-0 p-0">
              <legend className="bav-label mb-5 text-ink-60">— Condition</legend>
              <div className="flex flex-col gap-2">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-start gap-4 border border-ink-10 p-4 transition-colors ${
                      condition === c.value ? 'border-ink bg-paper' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={c.value}
                      checked={condition === c.value}
                      onChange={() => setCondition(c.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-display text-[17px] tracking-[-0.01em]">
                        {c.label}
                      </div>
                      <div className="mt-1 text-[13px] leading-[1.4] text-ink-60">
                        {c.hint}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="bav-label mb-3 block text-ink-60" htmlFor="notes">
                Anything else we should know (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className={`${inputBase} w-full resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Serial number, included accessories, known issues"
              />
            </div>

            <div className="mt-4 border-t border-ink-10 pt-8">
              <div className="bav-label mb-5 text-ink-60">— Your details</div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="bav-label mb-3 block text-ink-60" htmlFor="contactName">
                    Name
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    className={`${inputBase} w-full`}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="bav-label mb-3 block text-ink-60" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${inputBase} w-full`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="bav-label mb-3 block text-ink-60" htmlFor="phone">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`${inputBase} w-full`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For collection co-ordination"
                  />
                </div>
              </div>
            </div>

            {result?.kind === 'error' && (
              <div className="border border-red-500 bg-red-50 px-4 py-3 text-[13px] text-red-900">
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-4 bg-ink px-10 py-5 text-[13px] uppercase tracking-wider text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Get my offer'}
            </button>
            <p className="m-0 text-[13px] leading-[1.5] text-ink-60">
              By submitting, you agree to Birmingham AV contacting you about this trade-in.
              We do not share your details. You can withdraw any time.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
