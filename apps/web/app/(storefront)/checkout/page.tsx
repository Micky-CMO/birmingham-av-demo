'use client';

import Link from 'next/link';
import { useCartStore } from '@/stores/cart';
import { Button, GlassCard, Input } from '@/components/ui';
import { formatGbp } from '@bav/lib';
import { useState } from 'react';

export default function CheckoutPage() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const shipping = subtotal > 0 ? 0 : 0;
  const tax = subtotal * 0.2;
  const total = subtotal + shipping + tax;
  const [payMethod, setPayMethod] = useState<'stripe_card' | 'paypal'>('stripe_card');

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-h1 font-display">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-12">
        <form className="space-y-6 md:col-span-7">
          <Section title="Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input placeholder="First name" autoComplete="given-name" required />
              <Input placeholder="Last name" autoComplete="family-name" required />
              <Input placeholder="Email" type="email" autoComplete="email" required className="sm:col-span-2" />
              <Input placeholder="Phone" type="tel" autoComplete="tel" className="sm:col-span-2" />
            </div>
          </Section>

          <Section title="Shipping address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input placeholder="Address line 1" required className="sm:col-span-2" />
              <Input placeholder="Address line 2" className="sm:col-span-2" />
              <Input placeholder="City" required />
              <Input placeholder="Region" />
              <Input placeholder="Postcode" required />
              <Input placeholder="Country" defaultValue="United Kingdom" required />
            </div>
          </Section>

          <Section title="Payment">
            <div className="flex gap-2">
              {(['stripe_card', 'paypal'] as const).map((m) => (
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
                  {m === 'stripe_card' ? 'Card' : 'PayPal'}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-dashed border-ink-300 p-6 text-caption text-ink-500 dark:border-obsidian-500">
              {payMethod === 'stripe_card'
                ? 'Stripe Elements mounts here. Set STRIPE_PUBLISHABLE_KEY in .env.local to enable.'
                : 'PayPal button mounts here. Set PAYPAL_CLIENT_ID in .env.local to enable.'}
            </div>
          </Section>
        </form>

        <GlassCard className="h-fit p-6 md:col-span-5">
          <h2 className="text-h3 font-display">Order summary</h2>
          <ul className="mt-4 divide-y divide-ink-300/50 dark:divide-obsidian-500/40">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between py-3 text-small">
                <span className="line-clamp-1">
                  {l.qty} &times; {l.title}
                </span>
                <span>{formatGbp(l.pricePerUnitGbp * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ink-300/50 pt-4 text-small dark:border-obsidian-500/40">
            <Row label="Subtotal" value={formatGbp(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? 'Free' : formatGbp(shipping)} />
            <Row label="VAT (20%)" value={formatGbp(tax)} />
            <div className="mt-3 flex justify-between border-t border-ink-300/50 pt-3 text-body font-medium dark:border-obsidian-500/40">
              <span>Total</span>
              <span>{formatGbp(total)}</span>
            </div>
          </dl>
          <Button size="lg" className="mt-6 w-full">Pay {formatGbp(total)}</Button>
          <p className="mt-2 text-center text-caption text-ink-500">
            By placing your order you agree to our <Link href="/terms" className="underline">terms</Link>.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-caption text-ink-500">{title}</legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
