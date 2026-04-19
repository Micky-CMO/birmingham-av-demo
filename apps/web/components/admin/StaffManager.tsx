'use client';

import { useMemo, useState } from 'react';

export type StaffRow = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  mfaEnabled: boolean;
  lastActiveAt: string | null;
  status: 'active' | 'suspended' | 'invited';
  passkeys: number;
  lastLoginIp: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  builder: 'Builder',
  support_staff: 'Support',
  admin: 'Admin',
  super_admin: 'Super admin',
};

const PERMISSIONS: Record<string, string[]> = {
  builder: [
    'View assigned builds',
    'Update build status + QC',
    'Scan components for stock',
    'Cannot access customer data or orders',
  ],
  support_staff: [
    'View + reply to tickets',
    'Issue refunds up to £500',
    'View orders + customer details',
    'Cannot change staff roles',
  ],
  admin: [
    'All support + builder capabilities',
    'Edit products, pricing, inventory',
    'Approve returns + issue unlimited refunds',
    'Manage discounts + newsletters',
    'Cannot change super admin roles',
  ],
  super_admin: [
    'Everything',
    'Add + remove staff',
    'Edit all roles including super admin',
    'Access billing + Stripe integration',
  ],
};

function initials(firstName: string | null, lastName: string | null): string {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}

function formatLastActive(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 20) {
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hh}:${mm} today`;
  }
  if (diffH < 44) return 'yesterday';
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return `${Math.floor(diffD / 30)}mo ago`;
}

export function StaffManager({
  staff,
  stats,
}: {
  staff: StaffRow[];
  stats: { active: number; suspended: number; pending: number };
}) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('support_staff');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeStaff = useMemo(
    () => staff.find((s) => s.userId === openRow) ?? null,
    [staff, openRow]
  );

  const openEdit = (userId: string) => {
    const s = staff.find((x) => x.userId === userId);
    setOpenRow(userId);
    setEditRole(s ? s.role : null);
    setSaveError(null);
  };

  const submitInvite = async () => {
    if (!inviteEmail) {
      setInviteError('Email is required');
      return;
    }
    setInviteBusy(true);
    setInviteError(null);
    try {
      const res = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setInviteError(body?.error?.message ?? 'invite failed');
        return;
      }
      setInviteSent(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } finally {
      setInviteBusy(false);
    }
  };

  const saveRole = async () => {
    if (!activeStaff || !editRole) return;
    if (editRole === activeStaff.role) {
      setOpenRow(null);
      return;
    }
    setSaveBusy(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/staff/${activeStaff.userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body?.error?.message ?? 'save failed');
        return;
      }
      window.location.reload();
    } finally {
      setSaveBusy(false);
    }
  };

  const suspendAccount = async () => {
    if (!activeStaff) return;
    setSaveBusy(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/staff/${activeStaff.userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: activeStaff.status === 'suspended' ? 'active' : 'inactive',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body?.error?.message ?? 'action failed');
        return;
      }
      window.location.reload();
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          — Admin · Staff &amp; permissions
        </div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 144",
            marginBottom: 40,
          }}
        >
          Staff.
        </h1>

        <div
          className="flex flex-wrap items-center justify-between gap-5"
          style={{
            paddingBottom: 24,
            borderBottom: '1px solid var(--ink-10)',
          }}
        >
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--ink)' }}>
              <span>{stats.active}</span>
              <span style={{ color: 'var(--ink-60)' }}> ACTIVE</span>
            </span>
            <span style={{ width: 1, height: 12, background: 'var(--ink-10)' }} />
            <span className="font-mono text-[11px] tabular-nums">
              <span>{stats.suspended}</span>
              <span style={{ color: 'var(--ink-60)' }}> SUSPENDED</span>
            </span>
            <span style={{ width: 1, height: 12, background: 'var(--ink-10)' }} />
            <span className="font-mono text-[11px] tabular-nums">
              <span>{stats.pending}</span>
              <span style={{ color: 'var(--ink-60)' }}> PENDING INVITATIONS</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              className="bav-cta-secondary"
              onClick={() => {
                setInviteOpen(true);
                setInviteSent(false);
                setInviteEmail('');
                setInviteRole('support_staff');
                setInviteNote('');
                setInviteError(null);
              }}
            >
              Invite staff
            </button>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '40px 1.6fr 1fr 120px 160px 80px',
              gap: 24,
              padding: '12px 0',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            <span />
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              NAME
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              ROLE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              LAST ACTIVE
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              STATUS
            </span>
            <span />
          </div>

          {staff.length === 0 && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--ink-60)',
                fontSize: 13,
              }}
            >
              No staff yet. Invite someone to get started.
            </div>
          )}

          {staff.map((s) => {
            const is2faRisk = !s.mfaEnabled && (s.role === 'admin' || s.role === 'super_admin');
            return (
              <div
                key={s.userId}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '40px 1.6fr 1fr 120px 160px 80px',
                  gap: 24,
                  padding: '20px 0',
                  borderBottom: '1px solid var(--ink-10)',
                }}
              >
                <div
                  className="bav-ink-canvas flex items-center justify-center"
                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                >
                  <span
                    className="relative text-[11px]"
                    style={{
                      color: 'var(--paper)',
                      letterSpacing: '0.06em',
                      zIndex: 1,
                    }}
                  >
                    {initials(s.firstName, s.lastName) || s.email.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 18,
                      letterSpacing: '-0.01em',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.email}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 12, color: 'var(--ink-60)', marginTop: 2 }}
                  >
                    {s.email}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      border: '1px solid var(--ink-10)',
                      padding: '5px 10px',
                      display: 'inline-block',
                    }}
                  >
                    {ROLE_LABELS[s.role] ?? s.role}
                  </span>
                </div>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: 11, color: 'var(--ink-60)' }}
                >
                  {formatLastActive(s.lastActiveAt)}
                </span>
                <div className="flex items-center" style={{ gap: 10 }}>
                  {s.status === 'active' && (
                    <>
                      <span className="bav-pulse" />
                      <span className="font-mono tabular-nums" style={{ fontSize: 11 }}>
                        ACTIVE
                      </span>
                    </>
                  )}
                  {s.status === 'suspended' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ink-30)',
                          display: 'inline-block',
                        }}
                      />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink-30)' }}
                      >
                        SUSPENDED
                      </span>
                    </>
                  )}
                  {s.status === 'invited' && (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ink-30)',
                          display: 'inline-block',
                        }}
                      />
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink-30)' }}
                      >
                        INVITED
                      </span>
                    </>
                  )}
                  {is2faRisk && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#B94040',
                        display: 'inline-block',
                        marginLeft: 6,
                      }}
                      title="2FA disabled"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(s.userId)}
                  className="bav-underline justify-self-end"
                  style={{
                    fontSize: 13,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Open <span className="arrow">→</span>
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ height: 96 }} />
      </div>

      {activeStaff && (
        <>
          <div
            className="bav-slideover-backdrop"
            onClick={() => setOpenRow(null)}
            role="presentation"
          />
          <aside className="bav-slideover-panel" aria-label="Staff detail">
            <div style={{ padding: 40 }}>
              <div className="flex items-start justify-between" style={{ gap: 16 }}>
                <div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 32,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {[activeStaff.firstName, activeStaff.lastName].filter(Boolean).join(' ') ||
                      activeStaff.email}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 12, color: 'var(--ink-60)', marginTop: 6 }}
                  >
                    {activeStaff.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenRow(null)}
                  className="font-mono tabular-nums"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: 'var(--ink-60)',
                    padding: 4,
                  }}
                >
                  CLOSE ✕
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--ink-10)', marginTop: 28 }} />

              <div style={{ marginTop: 32 }}>
                <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
                  — Role &amp; permissions
                </div>
                <div>
                  {Object.keys(ROLE_LABELS).map((r) => (
                    <label
                      key={r}
                      className="flex items-start cursor-pointer"
                      style={{
                        gap: 14,
                        padding: '14px 0',
                        borderBottom: '1px solid var(--ink-10)',
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: `1px solid ${editRole === r ? 'var(--ink)' : 'var(--ink-30)'}`,
                          background: editRole === r ? 'var(--ink)' : 'transparent',
                          marginTop: 3,
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {editRole === r && (
                          <span
                            style={{
                              position: 'absolute',
                              inset: 3,
                              background: 'var(--paper)',
                            }}
                          />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={editRole === r}
                        onChange={() => setEditRole(r)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{ROLE_LABELS[r]}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-60)',
                            marginTop: 4,
                            lineHeight: 1.5,
                          }}
                        >
                          {(PERMISSIONS[r] ?? []).join(' · ')}
                        </div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 40 }}>
                <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
                  — Session &amp; security
                </div>
                <div>
                  {[
                    ['2FA', activeStaff.mfaEnabled ? 'Enabled (TOTP)' : 'Disabled'],
                    [
                      'Passkeys',
                      activeStaff.passkeys === 0
                        ? 'None registered'
                        : `${activeStaff.passkeys} registered`,
                    ],
                    [
                      'Last login',
                      activeStaff.lastActiveAt
                        ? `${formatLastActive(activeStaff.lastActiveAt)}${activeStaff.lastLoginIp ? ` · from ${activeStaff.lastLoginIp}` : ''}`
                        : 'Never signed in',
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="grid"
                      style={{
                        gridTemplateColumns: '160px 1fr',
                        gap: 16,
                        padding: '12px 0',
                        borderBottom: '1px solid var(--ink-10)',
                      }}
                    >
                      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                        {(k as string).toUpperCase()}
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 12, color: 'var(--ink)' }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {saveError && (
                <div
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 12,
                    color: '#B94040',
                    marginTop: 24,
                  }}
                >
                  {saveError}
                </div>
              )}

              <div
                style={{
                  marginTop: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  className="bav-cta"
                  style={{ width: '100%' }}
                  disabled={saveBusy}
                  onClick={saveRole}
                >
                  {saveBusy ? 'Saving…' : 'Save changes'}
                </button>
              </div>

              <div
                style={{
                  marginTop: 56,
                  paddingTop: 24,
                  borderTop: '1px solid var(--ink-10)',
                }}
              >
                <button
                  type="button"
                  onClick={suspendAccount}
                  disabled={saveBusy}
                  className="bav-label bav-hover-opa"
                  style={{
                    color: 'var(--ink-30)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {activeStaff.status === 'suspended' ? 'REINSTATE ACCOUNT' : 'SUSPEND ACCOUNT'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {inviteOpen && (
        <>
          <div
            className="bav-slideover-backdrop"
            onClick={() => setInviteOpen(false)}
            role="presentation"
          />
          <aside className="bav-slideover-panel" aria-label="Invite staff">
            <div style={{ padding: 40 }}>
              <div className="flex items-start justify-between" style={{ gap: 16 }}>
                <div>
                  <div
                    className="bav-label"
                    style={{ color: 'var(--ink-60)', marginBottom: 12 }}
                  >
                    — An email with a signup link will be sent
                  </div>
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 32,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    Invite a colleague.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="font-mono tabular-nums"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: 'var(--ink-60)',
                    padding: 4,
                  }}
                >
                  CLOSE ✕
                </button>
              </div>

              <div style={{ marginTop: 36 }}>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '160px 1fr',
                    gap: 16,
                    padding: '20px 0',
                    borderBottom: '1px solid var(--ink-10)',
                  }}
                >
                  <span className="bav-label" style={{ color: 'var(--ink-60)', paddingTop: 4 }}>
                    EMAIL
                  </span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@birminghamav.co.uk"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      width: '100%',
                      padding: '4px 0',
                    }}
                  />
                </div>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '160px 1fr',
                    gap: 16,
                    padding: '20px 0',
                    borderBottom: '1px solid var(--ink-10)',
                  }}
                >
                  <span className="bav-label" style={{ color: 'var(--ink-60)', paddingTop: 4 }}>
                    ROLE
                  </span>
                  <div>
                    {['support_staff', 'admin', 'super_admin'].map((r) => (
                      <label
                        key={r}
                        className="flex items-center cursor-pointer"
                        style={{ gap: 12, padding: '10px 0' }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            border: `1px solid ${inviteRole === r ? 'var(--ink)' : 'var(--ink-30)'}`,
                            background: inviteRole === r ? 'var(--ink)' : 'transparent',
                            position: 'relative',
                          }}
                        >
                          {inviteRole === r && (
                            <span
                              style={{
                                position: 'absolute',
                                inset: 2,
                                background: 'var(--paper)',
                              }}
                            />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="invite-role"
                          value={r}
                          checked={inviteRole === r}
                          onChange={() => setInviteRole(r)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: 14 }}>{ROLE_LABELS[r]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '160px 1fr',
                    gap: 16,
                    padding: '20px 0',
                    borderBottom: '1px solid var(--ink-10)',
                  }}
                >
                  <span className="bav-label" style={{ color: 'var(--ink-60)', paddingTop: 4 }}>
                    NOTE (OPTIONAL)
                  </span>
                  <textarea
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="A short greeting."
                    rows={3}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      width: '100%',
                      padding: '4px 0',
                      resize: 'vertical',
                      minHeight: 72,
                    }}
                  />
                </div>
              </div>

              {inviteError && (
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 12, color: '#B94040', marginTop: 16 }}
                >
                  {inviteError}
                </div>
              )}

              <button
                type="button"
                onClick={submitInvite}
                className="bav-cta"
                style={{ width: '100%', marginTop: 32 }}
                disabled={inviteBusy || inviteSent}
              >
                {inviteBusy ? 'Sending…' : inviteSent ? 'Sent' : 'Send invitation'}
              </button>

              {inviteSent && (
                <div className="flex items-center" style={{ gap: 10, marginTop: 20 }}>
                  <span className="bav-pulse" />
                  <span className="bav-label" style={{ color: 'var(--ink)' }}>
                    SENT. LINK EXPIRES IN 72 HOURS.
                  </span>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
