'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

type Errors = Partial<Record<'password' | 'confirm' | 'general', string>>;

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Errors = {};
    if (password.length < 10) next.password = 'At least 10 characters.';
    if (password !== confirm) next.confirm = "Doesn't match the password above.";
    if (!token) next.general = 'This reset link is incomplete. Request a new one.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!res.ok || !data.ok) {
        setErrors({
          general:
            data.error?.message ??
            'This reset link is no longer valid. Request a new one.',
        });
        setSubmitting(false);
        return;
      }
      router.push('/account');
      router.refresh();
    } catch {
      setErrors({ general: 'Network error. Try again.' });
      setSubmitting(false);
    }
  }

  const fieldClass = (err?: string) =>
    `bav-field-line ${err ? 'is-error' : ''}`.trim();

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <div className="px-12 py-8">
        <Link
          href="/"
          className="bav-hover-opa font-display text-[22px] font-light tracking-[-0.01em] text-ink no-underline"
        >
          Birmingham AV
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-24 pt-12">
        <div className="w-full max-w-[440px]">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bav-label mb-7 text-ink-60">— Set a new password</div>
            <h1 className="m-0 font-display text-[clamp(36px,4vw,52px)] font-light leading-[1.04] tracking-[-0.02em]">
              New <span className="bav-italic">password</span>.
            </h1>
            <p className="mb-10 mt-7 text-[15px] leading-[1.75] text-ink-60">
              Choose something at least 10 characters. We will sign you in straight
              after.
            </p>

            {errors.general && (
              <div
                role="alert"
                className="mb-7 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
              >
                {errors.general}
              </div>
            )}

            <div className="mb-7">
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="rPassword" className="bav-label text-ink-60">
                  — New password
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
                id="rPassword"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass(errors.password)}
              />
              {errors.password && (
                <div className="mt-2 text-[12px] text-[#B94040]">{errors.password}</div>
              )}
            </div>

            <div className="mb-10">
              <label htmlFor="rConfirm" className="bav-label mb-2 block text-ink-60">
                — Confirm new password
              </label>
              <input
                id="rConfirm"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass(errors.confirm)}
              />
              {errors.confirm && (
                <div className="mt-2 text-[12px] text-[#B94040]">{errors.confirm}</div>
              )}
            </div>

            <button type="submit" className="bav-cta" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update password & sign in'}
            </button>

            <p className="mt-8 text-center text-[12px] leading-[1.7] text-ink-30">
              Setting a new password signs out every other device.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ResetPageClient() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
