'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

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
 * Matches the AuthNav used on /auth/login so the two pages share a rhythm.
 * Lives outside the (storefront) layout, so we render just the wordmark
 * plus cart/search utility links — no full site shell.
 */
function AuthNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ink-10 bg-paper">
      <div className="bav-nav-inner mx-auto flex h-[60px] max-w-page items-center justify-between gap-6 px-12">
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
            <Link
              key={l.href}
              href={l.href}
              className="bav-hover-opa text-ink no-underline"
            >
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

type Errors = Partial<Record<
  'firstName' | 'lastName' | 'email' | 'password' | 'confirm' | 'accepted' | 'general',
  string
>>;

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fieldErrors: Errors = {};
    if (!firstName.trim()) fieldErrors.firstName = 'Required.';
    if (!lastName.trim()) fieldErrors.lastName = 'Required.';
    if (!email.includes('@')) fieldErrors.email = 'Use a valid email address.';
    if (password.length < 10) fieldErrors.password = 'At least 10 characters.';
    if (password !== confirm) fieldErrors.confirm = "Doesn't match the password above.";
    if (!accepted) fieldErrors.accepted = 'Please tick to agree to the terms.';
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        userId?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setErrors({
          general:
            res.status === 409
              ? 'An account with this email already exists. Try signing in instead.'
              : data.error?.message ?? 'Could not create account. Try again.',
        });
        setSubmitting(false);
        return;
      }
      // Sign the new user in straight away so they land on /account.
      await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim().toLowerCase(),
          password,
        }),
      }).catch(() => null);
      router.push(next);
      router.refresh();
    } catch {
      setErrors({ general: 'Network error. Try again.' });
      setSubmitting(false);
    }
  }

  function handleGoogle() {
    // Redirect to the OAuth start route. The stub returns 501 for now —
    // when the provider is wired up, this becomes a 302 to Google.
    window.location.href = `/api/auth/oauth/google/start?next=${encodeURIComponent(
      searchParams.get('next') ?? '/account',
    )}`;
  }

  const fieldClass = (err?: string) =>
    `bav-field-line ${err ? 'is-error' : ''}`.trim();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <AuthNav />

      <div className="bav-auth-split">
        {/* ---------------- Left: editorial half ---------------- */}
        <div className="bav-auth-left">
          <Link
            href="/"
            className="bav-hover-opa font-display text-[22px] font-light tracking-[-0.01em] text-ink no-underline"
          >
            Birmingham AV
          </Link>

          <div className="max-w-[520px]">
            <div className="bav-label mb-7 text-ink-60">— Create an account</div>
            <h1 className="m-0 font-display text-[clamp(40px,4.2vw,60px)] font-light leading-[1.04] tracking-[-0.02em]">
              An account, <span className="bav-italic">simply</span>.
            </h1>
            <p className="mt-8 max-w-[460px] text-[15px] leading-[1.75] text-ink-60">
              Track the build of your machine from component pick to courier hand-off.
              Keep serial numbers and warranty documents in one place. Start a return in
              two taps. That is the entire pitch.
            </p>
            <p className="mt-5 max-w-[460px] text-[15px] leading-[1.75] text-ink-60">
              No newsletter unless you ask. No data sold. Delete everything any time
              from{' '}
              <Link
                href="/account/security"
                className="bav-underline text-ink no-underline"
              >
                account settings
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <div className="bav-label mb-1.5 text-ink-30">— Warranty</div>
              <div className="text-[13px] text-ink-60">12 months · parts &amp; labour</div>
            </div>
            <div>
              <div className="bav-label mb-1.5 text-ink-30">— Returns</div>
              <div className="text-[13px] text-ink-60">30 days · no questions</div>
            </div>
            <div>
              <div className="bav-label mb-1.5 text-ink-30">— Support</div>
              <div className="text-[13px] text-ink-60">Human, in Birmingham</div>
            </div>
          </div>
        </div>

        {/* ---------------- Right: form half ---------------- */}
        <div className="bav-auth-right">
          <form onSubmit={handleSubmit} className="bav-auth-form" noValidate>
            <div className="mb-10 flex items-baseline justify-between">
              <h2 className="m-0 font-display text-[28px] font-light tracking-[-0.01em]">
                Register
              </h2>
              <Link
                href="/auth/login"
                className="bav-underline text-[13px] text-ink-60 no-underline"
              >
                Already have one? Sign in
              </Link>
            </div>

            {errors.general && (
              <div
                role="alert"
                className="mb-7 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
              >
                {errors.general}
              </div>
            )}

            {/* Google OAuth — secondary position, before the form */}
            <button
              type="button"
              onClick={handleGoogle}
              className="bav-cta-secondary mb-7 gap-3"
              style={{ padding: '19px 32px', fontSize: 12, textTransform: 'uppercase' }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18v6h7.73c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91H2.54v6.18C6.47 42.62 14.58 48 24 48z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59v-6.18H2.54C.92 16.46 0 20.12 0 24s.92 7.54 2.54 10.77l7.99-6.18z"
                />
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.58 0 6.47 5.38 2.54 13.23l7.99 6.18C12.43 13.72 17.74 9.5 24 9.5z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mb-8 flex items-center gap-4 text-ink-30">
              <div className="h-px flex-1 bg-ink-10" />
              <span className="bav-label text-ink-30">Or</span>
              <div className="h-px flex-1 bg-ink-10" />
            </div>

            {/* Name row */}
            <div className="bav-auth-name-row mb-7">
              <div>
                <label
                  htmlFor="firstName"
                  className="bav-label mb-2 block text-ink-60"
                >
                  — First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={fieldClass(errors.firstName)}
                />
                {errors.firstName && (
                  <div className="mt-2 text-[12px] text-[#B94040]">{errors.firstName}</div>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="bav-label mb-2 block text-ink-60"
                >
                  — Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={fieldClass(errors.lastName)}
                />
                {errors.lastName && (
                  <div className="mt-2 text-[12px] text-[#B94040]">{errors.lastName}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="mb-7">
              <label htmlFor="email" className="bav-label mb-2 block text-ink-60">
                — Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass(errors.email)}
              />
              {errors.email && (
                <div className="mt-2 text-[12px] text-[#B94040]">{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="mb-7">
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="password" className="bav-label text-ink-60">
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
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass(errors.password)}
              />
              <div
                className={`mt-2 text-[12px] ${
                  errors.password ? 'text-[#B94040]' : 'text-ink-30'
                }`}
              >
                {errors.password ||
                  'At least 10 characters. Mix of letters and numbers is sensible.'}
              </div>
            </div>

            {/* Confirm */}
            <div className="mb-8">
              <label htmlFor="confirm" className="bav-label mb-2 block text-ink-60">
                — Confirm password
              </label>
              <input
                id="confirm"
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

            {/* Terms */}
            <label className="mb-8 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="bav-checkbox mt-0.5"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className="text-[13px] leading-[1.6] text-ink-60">
                I agree to the{' '}
                <Link href="/terms" className="bav-underline text-ink no-underline">
                  terms of sale
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="bav-underline text-ink no-underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {errors.accepted && (
              <div className="-mt-5 mb-6 text-[12px] text-[#B94040]">
                {errors.accepted}
              </div>
            )}

            <button type="submit" className="bav-cta" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="mt-7 text-center text-[12px] leading-[1.7] text-ink-30">
              We will send a verification link to your email. You can order before
              verifying, but can only start a return once verified.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RegisterPageClient() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
