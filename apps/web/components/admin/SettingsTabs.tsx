'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Badge, Button, Dialog, GlassCard, Input, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

// ============ Types ============

type StaffUser = {
  userId: string;
  email: string;
  role: 'support_staff' | 'admin' | 'super_admin';
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  status: 'active' | 'inactive';
  lastLoginAt: string | null;
  createdAt: string;
};

type MeResponse = {
  user: {
    userId: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
    mfaEnabled: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  };
};

type StaffListResponse = {
  items: StaffUser[];
  total: number;
  auditLog: Array<{
    auditId: string;
    action: string;
    entityType: string;
    entityId: string;
    actorUserId: string | null;
    actorType: string;
    createdAt: string;
  }>;
};

type EnrollResponse = {
  secret: string;
  otpauthUrl: string;
  issuer: string;
  label: string;
};

type PasskeySummary = {
  credentialId: string;
  nickname: string | null;
  deviceType: 'single_device' | 'multi_device' | string;
  backedUp: boolean;
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

type PasskeyListResponse = { items: PasskeySummary[] };

type TabKey = 'profile' | 'security' | 'staff';

type SessionInfo = { userAgent: string; ip: string };

// ============ Fetch helpers ============

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// ============ Root ============

export function SettingsTabs({ sessionInfo }: { sessionInfo: SessionInfo }) {
  const [tab, setTab] = useState<TabKey>('profile');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'staff', label: 'Staff' },
  ];

  return (
    <div>
      <header className="flex flex-col gap-2 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-h2 font-display">Settings</h1>
          <p className="mt-1 text-small text-ink-500">
            Manage your profile, security, and team access.
          </p>
        </div>
      </header>

      <div className="flex gap-1 border-b border-ink-300/60 dark:border-obsidian-500/60">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'relative px-4 py-2.5 text-small font-medium transition-colors',
                active ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300',
              )}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="settings-underline"
                  className="absolute inset-x-2 bottom-[-1px] h-[2px] rounded-full bg-brand-green"
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'profile' && <ProfileTab />}
            {tab === 'security' && <SecurityTab sessionInfo={sessionInfo} />}
            {tab === 'staff' && <StaffTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ Profile ============

function ProfileTab() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: () => http<MeResponse>('/api/admin/me') });
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', bio: '' });
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (me.data?.user) {
      setForm({
        firstName: me.data.user.firstName ?? '',
        lastName: me.data.user.lastName ?? '',
        phone: me.data.user.phone ?? '',
        bio: me.data.user.bio ?? '',
      });
    }
  }, [me.data?.user?.userId, me.data?.user]);

  const save = useMutation({
    mutationFn: (input: typeof form) =>
      http<{ user: unknown }>('/api/admin/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      setToast('Profile saved.');
      qc.invalidateQueries({ queryKey: ['admin', 'me'] });
      setTimeout(() => setToast(null), 2400);
    },
    onError: (err: Error) => setToast(err.message),
  });

  async function uploadAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await http<{ avatarUrl: string }>('/api/admin/me/avatar', { method: 'POST', body: fd });
      await qc.invalidateQueries({ queryKey: ['admin', 'me'] });
      setToast('Avatar updated.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setToast(null), 2400);
    }
  }

  if (me.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48 md:col-span-2" />
      </div>
    );
  }
  if (me.isError || !me.data) {
    return (
      <GlassCard className="p-6">
        <p className="text-semantic-critical">Could not load profile: {(me.error as Error)?.message}</p>
      </GlassCard>
    );
  }

  const user = me.data.user;
  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('') ||
    (user.email[0] ?? '?').toUpperCase();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GlassCard className="p-6">
        <h2 className="text-h4 font-display">Avatar</h2>
        <p className="mt-1 text-caption text-ink-500">PNG, JPG or WebP. Max 2 MB.</p>
        <div className="mt-5 flex flex-col items-center gap-4">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border border-ink-300/60 bg-ink-100 dark:border-obsidian-500/60 dark:bg-obsidian-800">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.email} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-h2 text-brand-green">
                {initials}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={uploadAvatar}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading' : 'Change avatar'}
          </Button>
        </div>
        <div className="mt-6 border-t border-ink-300/40 pt-4 text-caption text-ink-500 dark:border-obsidian-500/30">
          <div className="flex items-center justify-between">
            <span>Role</span>
            <Badge tone="positive">{user.role.replace('_', ' ')}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Member since</span>
            <span className="font-mono">{new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:col-span-2">
        <h2 className="text-h4 font-display">Profile details</h2>
        <p className="mt-1 text-caption text-ink-500">
          Your name and contact info are visible to other staff only.
        </p>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            save.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput
              label="First name"
              value={form.firstName}
              onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
              autoComplete="given-name"
            />
            <LabeledInput
              label="Last name"
              value={form.lastName}
              onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-ink-700 dark:text-ink-300">Email</label>
            <Input value={user.email} readOnly className="bg-ink-100/60 dark:bg-obsidian-800/60" />
            <p className="mt-1 text-caption text-ink-500">
              Contact your super-admin to change your email address.
            </p>
          </div>
          <LabeledInput
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+44 ..."
            autoComplete="tel"
          />
          <div>
            <label className="mb-1 block text-caption font-medium text-ink-700 dark:text-ink-300">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="block w-full resize-y rounded-md border border-ink-300 bg-white px-3 py-2 text-body text-ink-900 placeholder:text-ink-500 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/25 dark:border-obsidian-500 dark:bg-obsidian-900 dark:text-ink-50"
              placeholder="Short description shown on your profile"
            />
            <p className="mt-1 text-right text-caption text-ink-500">{form.bio.length} / 500</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-caption text-ink-500">
              {toast ?? (save.isPending ? 'Saving...' : '')}
            </span>
            <Button type="submit" loading={save.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-caption font-medium text-ink-700 dark:text-ink-300">{props.label}</label>
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        type={props.type}
      />
    </div>
  );
}

// ============ Security ============

function SecurityTab({ sessionInfo }: { sessionInfo: SessionInfo }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: () => http<MeResponse>('/api/admin/me') });

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwToast, setPwToast] = useState<string | null>(null);

  const changePassword = useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      http('/api/admin/me/password', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwToast('Password updated.');
      setTimeout(() => setPwToast(null), 2400);
    },
    onError: (err: Error) => setPwError(err.message),
  });

  const [mfaOpen, setMfaOpen] = useState(false);
  const [enrollData, setEnrollData] = useState<EnrollResponse | null>(null);
  const [code, setCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const enroll = useMutation({
    mutationFn: () => http<EnrollResponse>('/api/admin/me/mfa/enroll', { method: 'POST' }),
    onSuccess: (data) => {
      setEnrollData(data);
      setMfaOpen(true);
      setCode('');
      setMfaError(null);
    },
    onError: (err: Error) => setMfaError(err.message),
  });

  const verify = useMutation({
    mutationFn: () => http('/api/admin/me/mfa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
    onSuccess: () => {
      setMfaOpen(false);
      setEnrollData(null);
      qc.invalidateQueries({ queryKey: ['admin', 'me'] });
    },
    onError: (err: Error) => setMfaError(err.message),
  });

  const disable = useMutation({
    mutationFn: () => http('/api/admin/me/mfa', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'me'] }),
  });

  function submitPassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    changePassword.mutate({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
  }

  const mfaEnabled = me.data?.user.mfaEnabled ?? false;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard className="p-6">
        <h2 className="text-h4 font-display">Change password</h2>
        <p className="mt-1 text-caption text-ink-500">
          Pick something at least 8 characters. A password manager is recommended.
        </p>
        <form className="mt-5 grid gap-3" onSubmit={submitPassword}>
          <LabeledInput
            label="Current password"
            type="password"
            value={pw.currentPassword}
            onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))}
            autoComplete="current-password"
          />
          <LabeledInput
            label="New password"
            type="password"
            value={pw.newPassword}
            onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))}
            autoComplete="new-password"
          />
          <LabeledInput
            label="Confirm new password"
            type="password"
            value={pw.confirm}
            onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
            autoComplete="new-password"
          />
          {pwError && <p className="text-caption text-semantic-critical">{pwError}</p>}
          {pwToast && <p className="text-caption text-brand-green">{pwToast}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={changePassword.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h4 font-display">Two-factor authentication</h2>
            <p className="mt-1 text-caption text-ink-500">
              Adds a 6-digit code from an authenticator app at sign-in.
            </p>
          </div>
          <Badge tone={mfaEnabled ? 'positive' : 'neutral'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          {mfaEnabled ? (
            <>
              <span className="text-caption text-ink-500">MFA is active on this account.</span>
              <Button variant="outline" size="sm" loading={disable.isPending} onClick={() => disable.mutate()}>
                Disable MFA
              </Button>
            </>
          ) : (
            <>
              <span className="text-caption text-ink-500">Scan a QR code to enrol your authenticator app.</span>
              <Button size="sm" loading={enroll.isPending} onClick={() => enroll.mutate()}>
                Enable MFA
              </Button>
            </>
          )}
        </div>
        {mfaError && !mfaOpen && <p className="mt-2 text-caption text-semantic-critical">{mfaError}</p>}
      </GlassCard>

      <div className="lg:col-span-2">
        <PasskeysSection />
      </div>

      <GlassCard className="p-6 lg:col-span-2">
        <h2 className="text-h4 font-display">Active sessions</h2>
        <p className="mt-1 text-caption text-ink-500">
          Signed-in devices. Only your current session is tracked in this preview.
        </p>
        <div className="mt-4 rounded-md border border-ink-300/40 bg-ink-50/40 p-4 dark:border-obsidian-500/30 dark:bg-obsidian-800/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse-green rounded-full bg-brand-green" />
                <span className="text-small font-medium">Current session</span>
              </div>
              <div className="mt-1 truncate font-mono text-caption text-ink-500">{sessionInfo.userAgent}</div>
            </div>
            <div className="text-right">
              <div className="text-caption text-ink-500">IP address</div>
              <div className="font-mono text-small">{sessionInfo.ip}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <Dialog open={mfaOpen} onClose={() => setMfaOpen(false)} title="Set up authenticator" size="md">
        {enrollData ? (
          <div className="space-y-4">
            <p className="text-small text-ink-500">
              Scan this QR with Google Authenticator, 1Password, Authy, or any TOTP-compatible app.
            </p>
            <div className="flex justify-center">
              <QrBlock url={enrollData.otpauthUrl} />
            </div>
            <details className="rounded-md border border-ink-300/40 p-3 text-caption dark:border-obsidian-500/30">
              <summary className="cursor-pointer font-medium">Can't scan? Enter the code manually</summary>
              <div className="mt-2 font-mono text-small break-all">{enrollData.secret}</div>
            </details>
            <div>
              <label className="mb-1 block text-caption font-medium text-ink-700 dark:text-ink-300">
                6-digit verification code
              </label>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
            </div>
            {mfaError && <p className="text-caption text-semantic-critical">{mfaError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMfaOpen(false)}>
                Cancel
              </Button>
              <Button loading={verify.isPending} disabled={code.length !== 6} onClick={() => verify.mutate()}>
                Verify and enable
              </Button>
            </div>
          </div>
        ) : (
          <Skeleton className="h-48" />
        )}
      </Dialog>
    </div>
  );
}

/**
 * Very small QR renderer that uses a public Google Chart-style image service as a
 * fallback. In production this should be swapped for a local SVG generator once a QR
 * dependency is approved. For now we render the otpauth:// URL as a scannable block.
 */
function QrBlock({ url }: { url: string }) {
  // Use the Google chart image API. This only runs client-side and only inside the
  // MFA enrolment dialog, so no server-side dependency is needed. If the request
  // fails (offline dev), the user can still enter the secret manually.
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  return (
    <div className="rounded-md border border-ink-300/60 bg-white p-3 dark:border-obsidian-500/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="TOTP QR code" width={200} height={200} />
    </div>
  );
}

// ============ Passkeys ============

function PasskeysSection() {
  const qc = useQueryClient();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState<PasskeySummary | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function');
  }, []);

  const list = useQuery({
    queryKey: ['admin', 'passkeys'],
    queryFn: () => http<PasskeyListResponse>('/api/admin/me/passkeys'),
    enabled: supported === true,
  });

  const remove = useMutation({
    mutationFn: (credentialId: string) =>
      http(`/api/admin/me/passkeys/${encodeURIComponent(credentialId)}`, { method: 'DELETE' }),
    onSuccess: () => {
      setToast('Passkey removed.');
      qc.invalidateQueries({ queryKey: ['admin', 'passkeys'] });
      setTimeout(() => setToast(null), 2400);
    },
    onError: (err: Error) => setError(err.message),
  });

  const rename = useMutation({
    mutationFn: (input: { credentialId: string; nickname: string }) =>
      http(`/api/admin/me/passkeys/${encodeURIComponent(input.credentialId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ nickname: input.nickname }),
      }),
    onSuccess: () => {
      setRenameOpen(null);
      setRenameValue('');
      setToast('Passkey renamed.');
      qc.invalidateQueries({ queryKey: ['admin', 'passkeys'] });
      setTimeout(() => setToast(null), 2400);
    },
    onError: (err: Error) => setError(err.message),
  });

  async function enroll() {
    setError(null);
    setBusy(true);
    try {
      // Dynamic import keeps @simplewebauthn/browser out of the initial bundle
      // for users who never open this panel.
      const { startRegistration } = await import('@simplewebauthn/browser');

      const optsRes = await http<{ options: Parameters<typeof startRegistration>[0]['optionsJSON'] }>(
        '/api/admin/me/passkeys/register/options',
        { method: 'POST' },
      );

      const attestation = await startRegistration({ optionsJSON: optsRes.options });

      // Ask the user for a friendly name, default to the UA's short form.
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const defaultName =
        /iPhone/.test(ua) ? 'iPhone'
        : /iPad/.test(ua) ? 'iPad'
        : /Android/.test(ua) ? 'Android device'
        : /Mac/.test(ua) ? 'Mac (Touch ID)'
        : /Windows/.test(ua) ? 'Windows Hello'
        : 'Passkey';
      const nickname = window.prompt('Name this passkey:', defaultName)?.trim() || defaultName;

      await http('/api/admin/me/passkeys/register/verify', {
        method: 'POST',
        body: JSON.stringify({ credential: attestation, nickname }),
      });

      setToast('Passkey added.');
      qc.invalidateQueries({ queryKey: ['admin', 'passkeys'] });
      setTimeout(() => setToast(null), 2400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey registration failed';
      // Users commonly abort the native prompt — keep that quiet.
      if (/cancelled|NotAllowedError|aborted/i.test(msg)) {
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (supported === false) {
    return (
      <GlassCard className="p-6">
        <h2 className="text-h4 font-display">Passkeys and biometrics</h2>
        <p className="mt-2 text-caption text-ink-500">
          Your device does not support passkeys. Try a recent Chrome, Edge, Safari, or Firefox on macOS,
          Windows, iOS, or Android.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-h4 font-display">Passkeys and biometrics</h2>
          <p className="mt-1 text-caption text-ink-500">
            Sign in with Touch ID, Face ID, Windows Hello, or a hardware security key. More secure than a
            password, and faster.
          </p>
        </div>
        <Button size="sm" loading={busy} onClick={enroll}>
          Add a passkey
        </Button>
      </div>

      {error && <p className="mt-3 text-caption text-semantic-critical">{error}</p>}
      {toast && <p className="mt-3 text-caption text-brand-green">{toast}</p>}

      <div className="mt-5">
        {list.isLoading ? (
          <Skeleton className="h-24" />
        ) : list.isError ? (
          <p className="text-caption text-semantic-critical">
            Could not load passkeys: {(list.error as Error).message}
          </p>
        ) : !list.data || list.data.items.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink-300/60 bg-ink-50/40 px-4 py-6 text-center text-caption text-ink-500 dark:border-obsidian-500/40 dark:bg-obsidian-800/40">
            No passkeys yet. Add one above to sign in without a password.
          </div>
        ) : (
          <ul className="divide-y divide-ink-300/40 dark:divide-obsidian-500/30">
            {list.data.items.map((p) => {
              const label = p.nickname ?? 'Unnamed passkey';
              const deviceTone: 'positive' | 'neutral' = p.backedUp ? 'positive' : 'neutral';
              const deviceLabel =
                p.deviceType === 'multi_device' ? 'Synced passkey' : 'Device-bound';
              const lastUsed = p.lastUsedAt
                ? new Date(p.lastUsedAt).toLocaleString('en-GB')
                : 'Never used';
              return (
                <li key={p.credentialId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-small font-medium">{label}</span>
                      <Badge tone={deviceTone}>{deviceLabel}</Badge>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-caption text-ink-500">
                      Last used: {lastUsed}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRenameOpen(p);
                        setRenameValue(p.nickname ?? '');
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={remove.isPending && remove.variables === p.credentialId}
                      onClick={() => {
                        if (window.confirm(`Remove "${label}"? You will no longer be able to sign in with it.`)) {
                          remove.mutate(p.credentialId);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!renameOpen} onClose={() => setRenameOpen(null)} title="Rename passkey" size="sm">
        <form
          className="space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!renameOpen) return;
            const trimmed = renameValue.trim();
            if (!trimmed) return;
            rename.mutate({ credentialId: renameOpen.credentialId, nickname: trimmed });
          }}
        >
          <LabeledInput label="Nickname" value={renameValue} onChange={setRenameValue} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setRenameOpen(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={rename.isPending} disabled={renameValue.trim().length === 0}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>
    </GlassCard>
  );
}

// ============ Staff ============

function StaffTab() {
  const qc = useQueryClient();
  const staff = useQuery({ queryKey: ['admin', 'staff'], queryFn: () => http<StaffListResponse>('/api/admin/staff') });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<{ email: string; firstName: string; lastName: string; role: StaffUser['role'] }>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'support_staff',
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  const createInvite = useMutation({
    mutationFn: () =>
      http<{ user: StaffUser; emailSent: boolean; tempPassword: string | null }>('/api/admin/staff/invite', {
        method: 'POST',
        body: JSON.stringify(invite),
      }),
    onSuccess: (data) => {
      setInviteOpen(false);
      setInvite({ email: '', firstName: '', lastName: '', role: 'support_staff' });
      setInviteNote(
        data.emailSent
          ? `Invite emailed to ${data.user.email}.`
          : `Invite created. Share temp password with ${data.user.email}: ${data.tempPassword}`,
      );
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setTimeout(() => setInviteNote(null), 8000);
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const patchStaff = useMutation({
    mutationFn: (input: { id: string; body: { role?: StaffUser['role']; status?: 'active' | 'inactive' } }) =>
      http(`/api/admin/staff/${input.id}`, { method: 'PATCH', body: JSON.stringify(input.body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  });

  return (
    <div className="grid gap-4">
      <GlassCard className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-h4 font-display">Staff</h2>
            <p className="mt-1 text-caption text-ink-500">
              {staff.data ? `${staff.data.total} members` : 'Loading members...'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setInviteError(null);
              setInviteOpen(true);
            }}
          >
            Invite staff
          </Button>
        </div>
        {inviteNote && (
          <p className="mt-3 rounded-md bg-brand-green-100 px-3 py-2 text-caption text-brand-green-600 dark:bg-brand-green/10 dark:text-brand-green-400">
            {inviteNote}
          </p>
        )}
        <div className="mt-5 overflow-x-auto">
          {staff.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <table className="w-full text-small">
              <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
                <tr>
                  <th className="px-3 py-3 text-left">Member</th>
                  <th className="px-3 py-3 text-left">Role</th>
                  <th className="px-3 py-3 text-left">MFA</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Last seen</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.data?.items.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-b border-ink-300/40 last:border-0 hover:bg-ink-50/60 dark:border-obsidian-500/30 dark:hover:bg-obsidian-800/50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-caption font-semibold text-brand-green">
                              {(u.firstName ?? u.email)[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{u.fullName ?? u.email}</div>
                          <div className="font-mono text-caption text-ink-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          patchStaff.mutate({
                            id: u.userId,
                            body: { role: e.target.value as StaffUser['role'] },
                          })
                        }
                        className="rounded-md border border-ink-300 bg-white px-2 py-1 text-caption dark:border-obsidian-500 dark:bg-obsidian-900"
                      >
                        <option value="support_staff">support staff</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      {u.mfaEnabled ? <Badge tone="positive">on</Badge> : <Badge tone="neutral">off</Badge>}
                    </td>
                    <td className="px-3 py-3">
                      {u.status === 'active' ? (
                        <Badge tone="positive">active</Badge>
                      ) : (
                        <Badge tone="warning">inactive</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-caption text-ink-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant={u.status === 'active' ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          patchStaff.mutate({
                            id: u.userId,
                            body: { status: u.status === 'active' ? 'inactive' : 'active' },
                          })
                        }
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 font-display">Recent admin activity</h2>
        <p className="mt-1 text-caption text-ink-500">Last 20 actions from the audit log.</p>
        <div className="mt-4 divide-y divide-ink-300/40 dark:divide-obsidian-500/30">
          {staff.isLoading ? (
            <Skeleton className="h-32" />
          ) : staff.data && staff.data.auditLog.length > 0 ? (
            staff.data.auditLog.map((a) => (
              <div key={a.auditId} className="flex items-center justify-between gap-4 py-2.5 text-small">
                <div>
                  <div className="font-mono text-caption text-ink-500">{a.action}</div>
                  <div className="text-caption text-ink-500">
                    {a.entityType} · {a.entityId.slice(0, 8)}
                  </div>
                </div>
                <div className="text-right font-mono text-caption text-ink-500">
                  {new Date(a.createdAt).toLocaleString('en-GB')}
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-caption text-ink-500">No recent activity.</p>
          )}
        </div>
      </GlassCard>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff member" size="md">
        <form
          className="space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setInviteError(null);
            createInvite.mutate();
          }}
        >
          <LabeledInput
            label="Email"
            type="email"
            value={invite.email}
            onChange={(v) => setInvite((i) => ({ ...i, email: v }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="First name"
              value={invite.firstName}
              onChange={(v) => setInvite((i) => ({ ...i, firstName: v }))}
            />
            <LabeledInput
              label="Last name"
              value={invite.lastName}
              onChange={(v) => setInvite((i) => ({ ...i, lastName: v }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-ink-700 dark:text-ink-300">Role</label>
            <select
              value={invite.role}
              onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value as StaffUser['role'] }))}
              className="block h-10 w-full rounded-md border border-ink-300 bg-white px-3 text-body dark:border-obsidian-500 dark:bg-obsidian-900"
            >
              <option value="support_staff">Support staff</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          {inviteError && <p className="text-caption text-semantic-critical">{inviteError}</p>}
          <p className="rounded-md bg-semantic-info/10 px-3 py-2 text-caption text-semantic-info">
            A temporary password will be emailed. If email is not configured, the password will display here after
            creation.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createInvite.isPending}>
              Send invite
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
