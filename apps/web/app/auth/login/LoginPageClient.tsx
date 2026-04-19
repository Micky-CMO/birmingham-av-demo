'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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

function IconKey() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function IconEye({ off }: { off?: boolean }) {
  if (off) {
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
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    );
  }
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Minimal nav for /auth/login — the auth segment lives outside the
 * (storefront) layout so it doesn't get the full Nav/Footer shell. We keep
 * just the wordmark + cart/search utility links to match the brand rhythm.
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

type ErrorField = '' | 'email' | 'password' | 'general';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [error, setError] = useState<ErrorField>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setPasskeySupported(
      typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function',
    );
  }, []);

  const fieldBorderClass = (field: ErrorField) =>
    error === field ? 'border-[#B94040]' : 'border-ink-10';

  function resetErrors() {
    setError('');
    setErrorMsg('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();
    if (!email) {
      setError('email');
      setErrorMsg('Enter your email address.');
      return;
    }
    if (!password) {
      setError('password');
      setErrorMsg('Enter your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        role?: string;
        error?: { message?: string };
      };
      if (!res.ok || !data.ok) {
        setError('general');
        setErrorMsg(data.error?.message ?? 'Email or password not recognised.');
        setLoading(false);
        return;
      }
      const isStaff = ['support_staff', 'admin', 'super_admin', 'builder'].includes(
        data.role ?? '',
      );
      const destination = isStaff && next === '/account' ? '/admin/dashboard' : next;
      router.push(destination);
      router.refresh();
    } catch {
      setError('general');
      setErrorMsg('Network error. Try again.');
      setLoading(false);
    }
  }

  async function handlePasskey() {
    resetErrors();
    setPasskeyBusy(true);
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const maybeEmail = email.includes('@') ? email.trim().toLowerCase() : undefined;

      const optsRes = await fetch('/api/auth/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maybeEmail ? { email: maybeEmail } : {}),
      });
      const optsData = (await optsRes.json().catch(() => ({}))) as {
        options?: Parameters<typeof startAuthentication>[0]['optionsJSON'];
        error?: { message?: string };
      };
      if (!optsRes.ok || !optsData.options) {
        throw new Error(optsData.error?.message ?? 'Could not start passkey sign-in');
      }

      const assertion = await startAuthentication({ optionsJSON: optsData.options });

      const verifyRes = await fetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const verifyData = (await verifyRes.json().catch(() => ({}))) as {
        userId?: string;
        role?: string;
        error?: { message?: string };
      };
      if (!verifyRes.ok || !verifyData.userId) {
        throw new Error(verifyData.error?.message ?? 'Passkey sign-in failed');
      }

      const isStaff = ['support_staff', 'admin', 'super_admin', 'builder'].includes(
        verifyData.role ?? '',
      );
      const destination = isStaff && next === '/account' ? '/admin/dashboard' : next;
      router.push(destination);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey sign-in failed';
      // User-cancelled browser prompts shouldn't bubble up as a visible error.
      if (!/cancelled|NotAllowedError|aborted/i.test(msg)) {
        setError('general');
        setErrorMsg(msg);
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <AuthNav />

      <div className="bav-login-layout">
        {/* Left — editorial */}
        <div className="bav-login-left">
          <Link
            href="/"
            className="font-display text-[22px] tracking-[-0.015em] text-ink no-underline"
          >
            Birmingham AV
          </Link>

          <div>
            <div className="bav-label mb-7 text-ink-60">— Your account</div>
            <h2 className="m-0 mb-8 font-display text-[clamp(36px,4.5vw,60px)] font-light leading-[1] tracking-[-0.025em]">
              Built by <span className="bav-italic">people</span>.
              <br />
              Tracked by <span className="bav-italic">you</span>.
            </h2>

            <div className="flex flex-col">
              {[
                { label: 'Every order', body: 'Traceable from component scan to front door.' },
                { label: 'Warranty', body: 'Twelve months, parts and labour, in one place.' },
                { label: 'Returns', body: 'Start a return or a repair in under sixty seconds.' },
                {
                  label: 'Your builds',
                  body: 'Lifetime component registry for every machine you own.',
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="grid border-b border-ink-10 py-[18px]"
                  style={{
                    gridTemplateColumns: '100px 1fr',
                    gap: 16,
                    borderTop: i === 0 ? '1px solid var(--ink-10)' : undefined,
                  }}
                >
                  <span className="bav-label text-ink-60">{item.label}</span>
                  <span className="text-[14px] leading-[1.5] text-ink">{item.body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bav-label text-ink-30">
            Birmingham AV Ltd · Reg. No. 12383651
          </div>
        </div>

        {/* Right — form */}
        <div className="bav-login-right">
          <div className="w-full max-w-[400px]">
            <div className="bav-label mb-6 text-ink-60">— Sign in</div>
            <h1 className="m-0 mb-10 font-display text-[clamp(32px,3.5vw,48px)] font-light leading-[1] tracking-[-0.025em]">
              Welcome <span className="bav-italic">back</span>.
            </h1>

            {error === 'general' && (
              <div
                role="alert"
                className="mb-5 border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-3.5 py-3 text-[13px] text-[#B94040]"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="bav-label mb-2 block text-ink-60">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email webauthn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      resetErrors();
                    }}
                    className={`bav-field w-full border bg-transparent px-3.5 py-3 text-[14px] text-ink ${fieldBorderClass(
                      'email',
                    )}`}
                    placeholder="you@example.co.uk"
                  />
                  {error === 'email' && (
                    <div className="mt-1.5 text-[12px] text-[#B94040]">{errorMsg}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="bav-label mb-2 block text-ink-60">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        resetErrors();
                      }}
                      className={`bav-field w-full border bg-transparent py-3 pl-3.5 pr-11 text-[14px] text-ink ${fieldBorderClass(
                        'password',
                      )}`}
                      placeholder="Your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-ink-30"
                    >
                      <IconEye off={showPass} />
                    </button>
                  </div>
                  {error === 'password' && (
                    <div className="mt-1.5 text-[12px] text-[#B94040]">{errorMsg}</div>
                  )}
                </div>
              </div>

              <div className="mb-6 text-right">
                <Link
                  href="/auth/forgot"
                  className="bav-label text-[10px] text-ink-60 no-underline transition-colors hover:text-ink"
                >
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="bav-cta mb-3">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {passkeySupported && (
              <>
                <div className="my-5 flex items-center gap-4 text-ink-30">
                  <div className="h-px flex-1 bg-ink-10" />
                  <span className="bav-label text-[9px]">or</span>
                  <div className="h-px flex-1 bg-ink-10" />
                </div>

                <button
                  type="button"
                  onClick={handlePasskey}
                  disabled={passkeyBusy}
                  className="bav-cta-secondary gap-3"
                >
                  <IconKey />
                  <span>{passkeyBusy ? 'Waiting for device…' : 'Sign in with passkey'}</span>
                </button>
              </>
            )}

            <div className="mt-8 border-t border-ink-10 pt-6 text-center">
              <span className="text-[14px] text-ink-60">Don&rsquo;t have an account? </span>
              <Link
                href="/auth/register"
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>Create one</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPageClient() {
  // useSearchParams needs a Suspense boundary in App Router pages.
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
