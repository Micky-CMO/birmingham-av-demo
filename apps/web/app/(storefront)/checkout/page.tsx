'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { Button, GlassCard, Input } from '@/components/ui';
import { formatGbp } from '@bav/lib';

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const shipping = 0;
  const tax = Math.round(subtotal * 0.2 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const [payMethod, setPayMethod] = useState<'stripe_card' | 'paypal' | 'manual'>('manual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get('email') || ''),
      firstName: String(fd.get('firstName') || ''),
      lastName: String(fd.get('lastName') || ''),
      phone: String(fd.get('phone') || '') || undefined,
      shipping: {
        label: 'Shipping',
        line1: String(fd.get('line1') || ''),
        line2: String(fd.get('line2') || '') || undefined,
        city: String(fd.get('city') || ''),
        region: String(fd.get('region') || '') || undefined,
        postcode: String(fd.get('postcode') || ''),
        countryIso2: 'GB',
      },
      customerNotes: String(fd.get('notes') || '') || undefined,
      preferredBuilderCode: String(fd.get('preferredBuilder') || '') || undefined,
      paymentMethod: payMethod,
      lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    };
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { orderNumber?: string; error?: { message: string } };
      if (!res.ok || !data.orderNumber) {
        setError(data.error?.message ?? 'Could not place order');
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/orders/${data.orderNumber}?placed=1`);
    } catch (err) {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-h1">Checkout</h1>
        <p className="mt-4 text-ink-500">Your cart is empty.</p>
        <Link href="/shop" className="mt-6 inline-block">
          <Button>Back to shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-h1 font-display">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="space-y-6 md:col-span-7">
          <Section title="Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="firstName" placeholder="First name" autoComplete="given-name" required />
              <Input name="lastName" placeholder="Last name" autoComplete="family-name" required />
              <Input name="email" placeholder="Email" type="email" autoComplete="email" required className="sm:col-span-2" />
              <Input name="phone" placeholder="Phone" type="tel" autoComplete="tel" className="sm:col-span-2" />
            </div>
          </Section>

          <Section title="Shipping address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="line1" placeholder="Address line 1" required className="sm:col-span-2" />
              <Input name="line2" placeholder="Address line 2" className="sm:col-span-2" />
              <Input name="city" placeholder="City" required />
              <Input name="region" placeholder="Region" />
              <Input name="postcode" placeholder="Postcode" required />
              <Input name="country" placeholder="Country" defaultValue="United Kingdom" required />
            </div>
          </Section>

          <Section title="Builder preference (optional)">
            <Input
              name="preferredBuilder"
              placeholder="e.g. BLD-001 — leave blank and we auto-assign"
            />
            <p className="mt-2 text-caption text-ink-500">
              Browse <Link href="/builders" className="text-brand-green hover:underline">builders</Link> and paste their
              code to request them specifically.
            </p>
          </Section>

          <Section title="Order notes (optional)">
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
              placeholder="Anything the builder should know about your build"
            />
          </Section>

          <Section title="Payment">
            <div className="flex gap-2">
              {(['stripe_card', 'paypal', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`rounded-md border px-4 py-2 text-small ${
                    payMethod === m
                      ? 'border-brand-green bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15'
                      : 'border-ink-300/60 dark:border-obsidian-500/60'
                  }`}
                >
                  {m === 'stripe_card' ? 'Card' : m === 'paypal' ? 'PayPal' : 'Invoice / BACS'}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-dashed border-ink-300 p-6 text-caption text-ink-500 dark:border-obsidian-500">
              {payMethod === 'stripe_card' &&
                'Stripe Elements mounts here once STRIPE_PUBLISHABLE_KEY is configured. For now, orders placed with this method are captured as demo orders and marked paid.'}
              {payMethod === 'paypal' &&
                'PayPal button mounts here once PAYPAL_CLIENT_ID is configured. Demo orders placed with this method are captured and marked paid.'}
              {payMethod === 'manual' &&
                'Invoice / BACS — order is created, builder is assigned, you receive an invoice by email. Pay within 7 days to release for build.'}
            </div>
          </Section>
        </div>

        <GlassCard className="h-fit p-6 md:col-span-5">
          <h2 className="text-h3 font-display">Order summary</h2>
          <ul className="mt-4 divide-y divide-ink-300/50 dark:divide-obsidian-500/40">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between py-3 text-small">
                <span className="line-clamp-1 pr-3">
                  {l.qty} &times; {l.title}
                </span>
                <span className="tabular-nums">{formatGbp(l.pricePerUnitGbp * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ink-300/50 pt-4 text-small dark:border-obsidian-500/40">
            <Row label="Subtotal" value={formatGbp(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? 'Free' : formatGbp(shipping)} />
            <Row label="VAT (20%)" value={formatGbp(tax)} />
            <div className="mt-3 flex justify-between border-t border-ink-300/50 pt-3 text-body font-medium dark:border-obsidian-500/40">
              <span>Total</span>
              <span className="tabular-nums">{formatGbp(total)}</span>
            </div>
          </dl>
          {error && (
            <p className="mt-4 rounded-md border border-semantic-critical/30 bg-semantic-critical/10 px-3 py-2 text-small text-semantic-critical">
              {error}
            </p>
          )}
          <Button size="lg" type="submit" loading={submitting} className="mt-6 w-full">
            Place order · {formatGbp(total)}
          </Button>
          <p className="mt-2 text-center text-caption text-ink-500">
            By placing your order you agree to our{' '}
            <Link href="/terms" className="underline">
              terms
            </Link>
            .
          </p>
        </GlassCard>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-caption uppercase tracking-widest text-ink-500">{title}</legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
