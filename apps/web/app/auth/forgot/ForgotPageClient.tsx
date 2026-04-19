'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

function IconArrowLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

export function ForgotPageClient() {
  const [view, setView] = useState<'forgot' | 'sent'>('forgot');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Use a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      // The endpoint always returns 200 to avoid account enumeration. Even
      // on an unexpected failure we still advance to the "sent" view for
      // the same reason.
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(() => null);
      setView('sent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {/* Wordmark — top-left */}
      <div className="px-12 py-8">
        <Link
          href="/"
          className="bav-hover-opa font-display text-[22px] font-light tracking-[-0.01em] text-ink no-underline"
        >
          Birmingham AV
        </Link>
      </div>

      {/* Centred form column */}
      <div className="flex flex-1 items-center justify-center px-6 pb-24 pt-12">
        <div className="w-full max-w-[440px]">
          {view === 'forgot' && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="bav-label mb-7 text-ink-60">— Forgotten password</div>
              <h1 className="m-0 font-display text-[clamp(36px,4vw,52px)] font-light leading-[1.04] tracking-[-0.02em]">
                We can <span className="bav-italic">reset</span> it.
              </h1>
              <p className="mb-10 mt-7 text-[15px] leading-[1.75] text-ink-60">
                Enter the email on your account. If it matches, we will send a link to
                set a new password. The link expires in one hour.
              </p>

              <div className="mb-9">
                <label
                  htmlFor="fEmail"
                  className="bav-label mb-2 block text-ink-60"
                >
                  — Email
                </label>
                <input
                  id="fEmail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={`bav-field-line ${error ? 'is-error' : ''}`.trim()}
                />
                {error && (
                  <div className="mt-2 text-[12px] text-[#B94040]">{error}</div>
                )}
              </div>

              <button type="submit" className="bav-cta" disabled={submitting}>
                {submitting ? 'Sending link…' : 'Send reset link'}
              </button>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/auth/login"
                  className="bav-underline text-[13px] text-ink-60 no-underline"
                >
                  <IconArrowLeft />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}

          {view === 'sent' && (
            <div>
              <div className="bav-label mb-7 text-ink-60">— Link sent</div>
              <h1 className="m-0 font-display text-[clamp(36px,4vw,52px)] font-light leading-[1.04] tracking-[-0.02em]">
                Check your <span className="bav-italic">inbox</span>.
              </h1>
              <p className="mb-3 mt-7 text-[15px] leading-[1.75] text-ink-60">
                We have sent a reset link to:
              </p>
              <p className="mb-8 border-b border-ink-10 pb-5 font-mono text-[14px] tabular-nums text-ink">
                {email || 'you@example.com'}
              </p>

              <div className="mb-10 grid gap-4">
                {[
                  { n: '01', body: 'The link works once and expires in an hour.' },
                  {
                    n: '02',
                    body: 'Nothing in your inbox? Check the junk folder, then try again.',
                  },
                  {
                    n: '03',
                    body: 'If the email is not on file you will not receive anything. We say so here, not in the email.',
                  },
                ].map((row) => (
                  <div key={row.n} className="grid grid-cols-[auto_1fr] gap-4">
                    <span className="bav-label pt-0.5 text-ink-30">{row.n}</span>
                    <div className="text-[14px] leading-[1.6] text-ink-60">
                      {row.body}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setView('forgot')}
                className="bav-cta"
              >
                Send another link
              </button>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/auth/login"
                  className="bav-underline text-[13px] text-ink-60 no-underline"
                >
                  <IconArrowLeft />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
