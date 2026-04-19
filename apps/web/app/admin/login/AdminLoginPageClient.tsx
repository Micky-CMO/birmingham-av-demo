'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

function IconArrowLeft() {
  return (
    <svg
      width="12"
      height="12"
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

type Errors = Partial<Record<'email' | 'password' | 'mfa' | 'general', string>>;

function AdminLoginInner({
  buildHash,
  environment,
  region,
}: {
  buildHash: string;
  environment: string;
  region: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: Errors = {};
    if (!showMfa) {
      if (!email.trim()) nextErrors.email = 'Staff email required.';
      if (password.length < 8) nextErrors.password = 'Password too short.';
    } else if (!/^[0-9]{6}$/.test(mfa)) {
      nextErrors.mfa = '6-digit code.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim(),
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        role?: string;
        error?: { message?: string };
      };
      if (!res.ok || !data.ok) {
        setErrors({
          general: data.error?.message ?? 'Email or password not recognised.',
        });
        setSubmitting(false);
        return;
      }
      const isStaff = ['support_staff', 'admin', 'super_admin', 'builder'].includes(
        data.role ?? '',
      );
      if (!isStaff) {
        setErrors({ general: 'This account does not have staff access.' });
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setErrors({ general: 'Network error. Try again.' });
      setSubmitting(false);
    }
  }

  const envDot =
    environment === 'production'
      ? 'var(--accent)'
      : environment === 'preview'
        ? '#F0B849'
        : 'var(--ink-60)';

  const fieldClass = (err?: string) =>
    `bav-field-line ${err ? 'is-error' : ''}`.trim();

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {/* Top strip — wordmark + admin mono + environment dot */}
      <header className="flex items-baseline justify-between border-b border-ink-10 px-10 py-8">
        <Link
          href="/"
          className="bav-hover-opa inline-flex items-baseline gap-[14px] no-underline"
        >
          <span className="font-display text-[22px] font-light tracking-[-0.01em] text-ink">
            Birmingham AV
          </span>
          <span className="bav-label text-ink-30">/ Admin</span>
        </Link>
        <div className="bav-label flex items-center gap-2.5 text-ink-30">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: envDot }}
          />
          {environment}
        </div>
      </header>

      {/* Centred card */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[420px] border border-ink-10 bg-paper"
          style={{ padding: '48px 44px' }}
        >
          <div className="bav-label mb-5 text-ink-60">— Staff access</div>

          <h1 className="m-0 font-display text-[32px] font-light leading-[1.1] tracking-[-0.01em]">
            {showMfa ? (
              <>
                Two-factor <span className="bav-italic">code</span>.
              </>
            ) : (
              'Sign in.'
            )}
          </h1>

          <p className="mb-9 mt-4 text-[14px] leading-[1.65] text-ink-60">
            {showMfa
              ? 'Enter the 6-digit code from your authenticator app. Codes refresh every 30 seconds.'
              : 'Staff credentials only. This area is not reachable from the public site.'}
          </p>

          {errors.general && (
            <div
              role="alert"
              className="mb-6 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
            >
              {errors.general}
            </div>
          )}

          {!showMfa ? (
            <>
              <div className="mb-6">
                <label
                  htmlFor="admEmail"
                  className="bav-label mb-2 block text-ink-60"
                >
                  — Email
                </label>
                <input
                  id="admEmail"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass(errors.email)}
                />
                {errors.email && (
                  <div className="mt-2 text-[12px] text-[#B94040]">{errors.email}</div>
                )}
              </div>

              <div className="mb-10">
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="admPw" className="bav-label text-ink-60">
                    — Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="bav-label bav-hover-opa cursor-pointer border-0 bg-transparent p-0 text-ink-30"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="admPw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass(errors.password)}
                />
                {errors.password && (
                  <div className="mt-2 text-[12px] text-[#B94040]">{errors.password}</div>
                )}
              </div>
            </>
          ) : (
            <div className="mb-10">
              <label
                htmlFor="admMfa"
                className="bav-label mb-2 block text-ink-60"
              >
                — 6-digit code
              </label>
              <input
                id="admMfa"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mfa}
                onChange={(e) => setMfa(e.target.value.replace(/\D/g, ''))}
                className={`${fieldClass(errors.mfa)} bav-mfa-input`}
              />
              {errors.mfa && (
                <div className="mt-2 text-[12px] text-[#B94040]">{errors.mfa}</div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMfa(false);
                  setMfa('');
                  setErrors({});
                }}
                className="bav-underline mt-5 cursor-pointer border-0 bg-transparent p-0 text-[12px] text-ink-60"
              >
                <IconArrowLeft />
                Use different credentials
              </button>
            </div>
          )}

          <button
            type="submit"
            className="bav-cta bav-cta-compact"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : showMfa ? 'Verify & continue' : 'Sign in'}
          </button>

          <div className="mt-8 flex items-center justify-between border-t border-ink-10 pt-6">
            <Link
              href="/support"
              className="bav-underline text-[12px] text-ink-60 no-underline"
            >
              Locked out? Contact IT
            </Link>
            <span className="bav-label text-ink-30">build {buildHash}</span>
          </div>
        </form>
      </main>

      {/* Footer strip */}
      <footer className="flex items-center justify-between border-t border-ink-10 px-10 py-5">
        <span className="bav-label text-ink-30">
          © Birmingham AV · Staff console
        </span>
        <span className="bav-label text-ink-30">{region}</span>
      </footer>
    </div>
  );
}

export function AdminLoginPageClient(props: {
  buildHash: string;
  environment: string;
  region: string;
}) {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner {...props} />
    </Suspense>
  );
}
