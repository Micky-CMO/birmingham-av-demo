'use client';

import { useState, type FormEvent } from 'react';

export function StockAlertForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? 'Could not save alert');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-ink bg-paper-2 p-6">
        <div className="bav-label mb-2 text-ink-60">— Noted</div>
        <p className="text-[15px] leading-[1.55]">
          We'll email {email} the moment {productTitle} is on the floor again. One notification, no follow-up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="bav-label text-ink-60">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="border-0 border-b border-ink-10 bg-transparent py-3 text-[15px] outline-none focus:border-ink"
        />
      </label>

      {error && <div className="font-mono text-[12px] text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="bav-label text-ink-60">— You can unsubscribe from the email itself</div>
        <button
          type="submit"
          disabled={submitting}
          className="border border-ink bg-ink px-8 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Saving…' : 'Notify me →'}
        </button>
      </div>
    </form>
  );
}
