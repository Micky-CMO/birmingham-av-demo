'use client';

import { useState } from 'react';

export type SecurityUser = {
  email: string;
  mfaEnabled: boolean;
  passwordLastChangedAt: string;
};

export type SecurityPasskey = {
  credentialId: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string | null;
  platform: 'macos' | 'ios' | 'other';
};

export function SecurityPanels({
  user,
  passkeys: initialPasskeys,
}: {
  user: SecurityUser;
  passkeys: SecurityPasskey[];
}) {
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [passkeys, setPasskeys] = useState<SecurityPasskey[]>(initialPasskeys);

  const pwdStrength = calcStrength(pwd.next);
  const pwdMatches = pwd.next.length > 0 && pwd.next === pwd.confirm;
  const canSubmitPwd = pwd.current.length >= 8 && pwd.next.length >= 8 && pwdMatches;

  return (
    <>
      {/* Section 01 — Password */}
      <Section number="01" label="Password">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 className="font-display" style={{ fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}>
            Change password
          </h2>
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-60)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            Last changed {formatDate(user.passwordLastChangedAt)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
          <PasswordField
            label="Current password"
            value={pwd.current}
            onChange={(v) => setPwd({ ...pwd, current: v })}
            visible={show.current}
            onToggle={() => setShow({ ...show, current: !show.current })}
          />
          <div>
            <PasswordField
              label="New password"
              value={pwd.next}
              onChange={(v) => setPwd({ ...pwd, next: v })}
              visible={show.next}
              onToggle={() => setShow({ ...show, next: !show.next })}
            />
            {pwd.next.length > 0 && <StrengthMeter strength={pwdStrength} />}
          </div>
          <PasswordField
            label="Confirm new password"
            value={pwd.confirm}
            onChange={(v) => setPwd({ ...pwd, confirm: v })}
            visible={show.confirm}
            onToggle={() => setShow({ ...show, confirm: !show.confirm })}
            error={pwd.confirm.length > 0 && !pwdMatches ? "Passwords don't match" : null}
          />

          <button
            type="button"
            disabled={!canSubmitPwd}
            className="bav-cta"
            style={{
              width: 'auto',
              padding: '18px 36px',
              alignSelf: 'flex-start',
              opacity: canSubmitPwd ? 1 : 0.35,
              cursor: canSubmitPwd ? 'pointer' : 'not-allowed',
            }}
            onClick={async () => {
              if (!canSubmitPwd) return;
              try {
                await fetch('/api/admin/me/password', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
                });
                setPwd({ current: '', next: '', confirm: '' });
              } catch {
                // surface errors in a future iteration
              }
            }}
          >
            Update password
          </button>
        </div>
      </Section>

      {/* Section 02 — 2FA */}
      <Section number="02" label="Two-factor authentication">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 className="font-display" style={{ fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}>
            Authenticator app
          </h2>
          <StatusPill on={mfaEnabled} />
        </div>

        {mfaEnabled && !mfaEnrolling && (
          <div>
            <p
              style={{
                margin: 0,
                marginBottom: 20,
                color: 'var(--ink-60)',
                fontSize: 14,
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              Two-factor authentication is enabled via a time-based authenticator app. You&apos;ll be asked
              for a 6-digit code when signing in from a new device.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="bav-cta-secondary"
                style={{ width: 'auto', padding: '14px 28px', fontSize: 12 }}
              >
                Download recovery codes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Disable 2FA?')) setMfaEnabled(false);
                }}
                className="bav-hover-opa font-mono"
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: '#B94040',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  alignSelf: 'center',
                }}
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {!mfaEnabled && !mfaEnrolling && (
          <div>
            <p
              style={{
                margin: 0,
                marginBottom: 20,
                color: 'var(--ink-60)',
                fontSize: 14,
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              Add a second step to sign-in using an authenticator app such as 1Password, Authy, or Google
              Authenticator. We recommend enabling this even if you use passkeys.
            </p>
            <button
              type="button"
              onClick={() => setMfaEnrolling(true)}
              className="bav-cta"
              style={{ width: 'auto', padding: '18px 36px' }}
            >
              Enable 2FA
            </button>
          </div>
        )}

        {mfaEnrolling && (
          <MFAEnrollFlow
            code={totpCode}
            setCode={setTotpCode}
            onVerify={() => {
              if (totpCode.length === 6) {
                setMfaEnabled(true);
                setMfaEnrolling(false);
                setTotpCode('');
              }
            }}
            onCancel={() => {
              setMfaEnrolling(false);
              setTotpCode('');
            }}
          />
        )}
      </Section>

      {/* Section 03 — Passkeys */}
      <Section number="03" label="Passkeys">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 className="font-display" style={{ fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}>
            Registered devices
          </h2>
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-60)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            {String(passkeys.length).padStart(2, '0')} registered
          </div>
        </div>
        <p
          style={{
            margin: 0,
            marginBottom: 28,
            color: 'var(--ink-60)',
            fontSize: 14,
            lineHeight: 1.55,
            maxWidth: 520,
          }}
        >
          Sign in with your device&apos;s biometrics or PIN — no password to remember, nothing to phish. Use
          a different passkey for each device you sign in from.
        </p>

        <div style={{ borderTop: '1px solid var(--ink-10)' }}>
          {passkeys.map((p) => (
            <PasskeyRow
              key={p.credentialId}
              passkey={p}
              onRename={(name) =>
                setPasskeys((xs) =>
                  xs.map((x) => (x.credentialId === p.credentialId ? { ...x, nickname: name } : x)),
                )
              }
              onRemove={() => {
                if (confirm(`Remove passkey "${p.nickname}"?`)) {
                  setPasskeys((xs) => xs.filter((x) => x.credentialId !== p.credentialId));
                }
              }}
            />
          ))}
          {passkeys.length === 0 && (
            <div
              style={{
                padding: '32px 0',
                borderBottom: '1px solid var(--ink-10)',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: 'var(--ink-60)', fontSize: 14 }}>No passkeys registered.</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <button
            type="button"
            className="bav-cta-secondary"
            style={{ width: 'auto', padding: '16px 32px' }}
          >
            + Add a passkey
          </button>
        </div>
      </Section>

      {/* Section 04 — Sessions (placeholder — sessions live in cookies only today) */}
      <Section number="04" label="Active sessions" isLast>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 className="font-display" style={{ fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}>
            Where you&apos;re signed in
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            marginBottom: 28,
            color: 'var(--ink-60)',
            fontSize: 14,
            lineHeight: 1.55,
            maxWidth: 520,
          }}
        >
          Session management lands with the next auth upgrade. If you want to be signed out of everywhere,
          change your password — every active session will be revoked.
        </p>

        <div style={{ borderTop: '1px solid var(--ink-10)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              alignItems: 'center',
              padding: '20px 0',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>This device</div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: '#1EB53A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span className="bav-pulse" aria-hidden="true" />
                  Current
                </span>
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 11, color: 'var(--ink-60)', marginTop: 4, letterSpacing: '0.04em' }}
              >
                Signed in now
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Section({
  number,
  label,
  children,
  isLast,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <section
      className="bav-security-section"
      style={{
        borderTop: '1px solid var(--ink-10)',
        borderBottom: isLast ? '1px solid var(--ink-10)' : 'none',
        padding: '48px 0',
      }}
    >
      <div>
        <div
          className="font-display bav-italic"
          style={{ fontSize: 40, fontWeight: 300, lineHeight: 1, color: 'var(--ink)' }}
        >
          №{number}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--ink-60)',
            marginTop: 8,
          }}
        >
          {label}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  error?: string | null;
}) {
  return (
    <div>
      <label
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-60)',
          marginBottom: 8,
          display: 'block',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${error ? '#B94040' : 'var(--ink-30)'}`,
        }}
      >
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            fontSize: 15,
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            color: 'var(--ink)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="bav-hover-opa font-mono"
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'var(--ink-60)',
            background: 'transparent',
            border: 'none',
            padding: '8px 4px',
            cursor: 'pointer',
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <div
          className="font-mono"
          style={{ fontSize: 10, color: '#B94040', marginTop: 6, letterSpacing: '0.1em' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function StrengthMeter({ strength }: { strength: number }) {
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#B94040', '#B98E40', '#8F9E40', '#1EB53A'];
  const idx = Math.max(0, Math.min(3, strength - 1));

  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2,
              background: i <= idx ? colors[idx] : 'var(--ink-10)',
              transition: 'background 200ms',
            }}
          />
        ))}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--ink-60)',
          minWidth: 50,
        }}
      >
        {strength > 0 ? labels[idx] : ''}
      </div>
    </div>
  );
}

function calcStrength(s: string): number {
  if (!s) return 0;
  let n = 0;
  if (s.length >= 8) n++;
  if (s.length >= 12) n++;
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++;
  if (/[0-9]/.test(s) && /[^A-Za-z0-9]/.test(s)) n++;
  return Math.min(4, n);
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: on ? '#1EB53A' : 'var(--ink-60)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--ink-10)',
        padding: '5px 10px',
      }}
    >
      {on && <span className="bav-pulse" aria-hidden="true" />}
      {on ? 'Enabled' : 'Not enabled'}
    </span>
  );
}

function MFAEnrollFlow({
  code,
  setCode,
  onVerify,
  onCancel,
}: {
  code: string;
  setCode: (v: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}) {
  const canVerify = code.length === 6 && /^\d{6}$/.test(code);

  return (
    <div
      className="bav-mfa-enroll"
      style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 40, maxWidth: 640 }}
    >
      <div>
        <div
          aria-label="Scan this QR code with your authenticator app"
          style={{
            width: 180,
            height: 180,
            background: 'var(--paper-2)',
            border: '1px solid var(--ink-10)',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: 10, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: '0.16em' }}
          >
            QR code
          </div>
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'var(--ink-60)',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Scan with authenticator
        </div>
      </div>

      <div>
        <ol
          style={{
            margin: 0,
            marginBottom: 20,
            paddingLeft: 20,
            color: 'var(--ink-60)',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          <li>Open your authenticator app (1Password, Authy, Google Authenticator…)</li>
          <li>Scan the QR code to the left, or enter the secret below manually</li>
          <li>Enter the 6-digit code your app generates to confirm</li>
        </ol>

        <div
          className="font-mono"
          style={{
            padding: '10px 14px',
            background: 'var(--paper-2)',
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--ink)',
            marginBottom: 24,
            userSelect: 'all',
          }}
        >
          Secret will be generated after enrol
        </div>

        <label
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-60)',
            marginBottom: 10,
            display: 'block',
          }}
        >
          6-digit code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="font-mono"
          style={{
            fontSize: 28,
            letterSpacing: '0.3em',
            padding: '10px 0',
            border: 'none',
            borderBottom: '1px solid var(--ink-30)',
            background: 'transparent',
            color: 'var(--ink)',
            outline: 'none',
            width: 200,
          }}
        />

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!canVerify}
            onClick={onVerify}
            className="bav-cta"
            style={{
              width: 'auto',
              padding: '18px 36px',
              opacity: canVerify ? 1 : 0.35,
              cursor: canVerify ? 'pointer' : 'not-allowed',
            }}
          >
            Verify and enable
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bav-cta-secondary"
            style={{ width: 'auto', padding: '16px 32px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PasskeyRow({
  passkey,
  onRename,
  onRemove,
}: {
  passkey: SecurityPasskey;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto auto',
        gap: 20,
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid var(--ink-10)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '1px solid var(--ink-10)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink-60)',
        }}
      >
        <PlatformIcon platform={passkey.platform} />
      </div>

      <div>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{passkey.nickname}</div>
        <div
          className="font-mono"
          style={{ fontSize: 11, color: 'var(--ink-60)', marginTop: 4, letterSpacing: '0.04em' }}
        >
          Added {formatDate(passkey.createdAt)}
          {passkey.lastUsedAt && <> · Used {formatRelative(passkey.lastUsedAt)}</>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const name = prompt('Rename this passkey:', passkey.nickname);
          if (name && name.trim()) onRename(name.trim());
        }}
        className="bav-hover-opa font-mono"
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--ink-60)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Rename
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="bav-hover-opa font-mono"
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: '#B94040',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Remove
      </button>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: 'macos' | 'ios' | 'other' }) {
  if (platform === 'macos') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 2c1 2-.5 4-2 4-.5-2 1.5-4 2-4zM19 17c-.5 1-1.5 2-3 2-1 0-1.5-.6-2.5-.6s-1.5.6-2.5.6c-1.5 0-3-1.3-4-3-2-3.5-.5-7.5 1.5-8.5 1.2-.5 2.5 0 3 0s2-.5 3-.5c1.5 0 3 1 4 2.5-3 1.5-2.5 5.5.5 7.5z" />
      </svg>
    );
  }
  if (platform === 'ios') {
    return (
      <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="12" y1="16" x2="12" y2="20" />
    </svg>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function formatRelative(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}
