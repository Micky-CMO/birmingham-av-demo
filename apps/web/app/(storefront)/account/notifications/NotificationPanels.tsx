'use client';

import { useState } from 'react';

export type NotificationPrefs = {
  email: {
    address: string;
    verified: boolean;
    orderUpdates: boolean;
    shippingUpdates: boolean;
    avCareUpdates: boolean;
    journalDigest: boolean;
    marketing: boolean;
  };
  push: {
    browserEnabled: boolean;
    orderUpdates: boolean;
    shippingUpdates: boolean;
    avCareUpdates: boolean;
  };
  telegram: {
    connected: boolean;
    handle: string | null;
    orderUpdates: boolean;
    shippingUpdates: boolean;
    avCareUpdates: boolean;
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
};

export function NotificationPanels({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const patchEmail = <K extends keyof NotificationPrefs['email']>(
    k: K,
    v: NotificationPrefs['email'][K],
  ) => setPrefs((p) => ({ ...p, email: { ...p.email, [k]: v } }));
  const patchPush = <K extends keyof NotificationPrefs['push']>(k: K, v: NotificationPrefs['push'][K]) =>
    setPrefs((p) => ({ ...p, push: { ...p.push, [k]: v } }));
  const patchTelegram = <K extends keyof NotificationPrefs['telegram']>(
    k: K,
    v: NotificationPrefs['telegram'][K],
  ) => setPrefs((p) => ({ ...p, telegram: { ...p.telegram, [k]: v } }));
  const patchQuiet = <K extends keyof NotificationPrefs['quietHours']>(
    k: K,
    v: NotificationPrefs['quietHours'][K],
  ) => setPrefs((p) => ({ ...p, quietHours: { ...p.quietHours, [k]: v } }));

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedMessage('Preferences saved');
    } catch {
      setSavedMessage('Could not save — try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Email */}
      <ChannelBlock
        number="01"
        title="Email"
        titleItalic="notifications"
        endMeta={{
          kind: prefs.email.verified ? 'verified' : 'muted',
          text: prefs.email.address,
        }}
      >
        <ToggleRow
          label="Order updates"
          description="Confirmation, status changes, and build progress for orders."
          on={prefs.email.orderUpdates}
          onChange={(v) => patchEmail('orderUpdates', v)}
        />
        <ToggleRow
          label="Shipping and delivery"
          description="Despatch confirmations, carrier tracking links, and delivery windows."
          on={prefs.email.shippingUpdates}
          onChange={(v) => patchEmail('shippingUpdates', v)}
        />
        <ToggleRow
          label="AV Care"
          description="Billing, claim status, and coverage changes to your AV Care subscription."
          on={prefs.email.avCareUpdates}
          onChange={(v) => patchEmail('avCareUpdates', v)}
        />
        <ToggleRow
          label="Journal digest"
          description="A monthly round-up of new writing — build guides, deep-dives, reviews."
          on={prefs.email.journalDigest}
          onChange={(v) => patchEmail('journalDigest', v)}
        />
        <ToggleRow
          label="Marketing and offers"
          description="New product drops, limited runs, and seasonal offers. Never more than twice a month."
          on={prefs.email.marketing}
          onChange={(v) => patchEmail('marketing', v)}
          isLast
        />
      </ChannelBlock>

      {/* Push */}
      <ChannelBlock
        number="02"
        title="Browser"
        titleItalic="push"
        endMeta={{
          kind: prefs.push.browserEnabled ? 'verified' : 'muted',
          text: prefs.push.browserEnabled ? 'Permission granted' : 'Permission required',
        }}
      >
        {!prefs.push.browserEnabled && (
          <div
            style={{
              padding: '20px 24px',
              background: 'var(--paper-2)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.55, flex: '1 1 240px' }}
            >
              To receive push notifications, grant your browser permission. You can turn this off at any time
              in your browser settings.
            </div>
            <button
              type="button"
              onClick={() => patchPush('browserEnabled', true)}
              className="bav-cta"
              style={{ width: 'auto', padding: '14px 28px', fontSize: 12 }}
            >
              Enable browser push
            </button>
          </div>
        )}

        <ToggleRow
          label="Order updates"
          description="Confirmation, status changes, and build progress."
          on={prefs.push.orderUpdates}
          onChange={(v) => patchPush('orderUpdates', v)}
          disabled={!prefs.push.browserEnabled}
        />
        <ToggleRow
          label="Shipping and delivery"
          description="Real-time delivery window updates on dispatch day."
          on={prefs.push.shippingUpdates}
          onChange={(v) => patchPush('shippingUpdates', v)}
          disabled={!prefs.push.browserEnabled}
        />
        <ToggleRow
          label="AV Care"
          description="Claim status changes — usually within minutes of an update."
          on={prefs.push.avCareUpdates}
          onChange={(v) => patchPush('avCareUpdates', v)}
          disabled={!prefs.push.browserEnabled}
          isLast
        />
      </ChannelBlock>

      {/* Telegram */}
      <ChannelBlock
        number="03"
        title="Telegram"
        titleItalic="relay"
        endMeta={{
          kind: prefs.telegram.connected ? 'verified' : 'muted',
          text: prefs.telegram.connected ? `@${prefs.telegram.handle ?? ''}` : 'Not connected',
        }}
      >
        {!prefs.telegram.connected && (
          <TelegramConnect
            onConnect={() => {
              const handle = prompt('Enter your Telegram handle (without @):', '');
              if (handle && handle.trim()) {
                setPrefs((p) => ({
                  ...p,
                  telegram: { ...p.telegram, connected: true, handle: handle.trim() },
                }));
              }
            }}
          />
        )}

        {prefs.telegram.connected && (
          <>
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--paper-2)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 240px' }}>
                <TelegramIcon />
                <div>
                  <div
                    className="font-mono"
                    style={{ fontSize: 13, color: 'var(--ink)', letterSpacing: '0.02em' }}
                  >
                    @{prefs.telegram.handle}
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-60)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                      marginTop: 3,
                    }}
                  >
                    Connected
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Disconnect Telegram?')) {
                    setPrefs((p) => ({
                      ...p,
                      telegram: {
                        connected: false,
                        handle: null,
                        orderUpdates: false,
                        shippingUpdates: false,
                        avCareUpdates: false,
                      },
                    }));
                  }
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
                }}
              >
                Disconnect
              </button>
            </div>

            <ToggleRow
              label="Order updates"
              description="A message when your order moves between build stages."
              on={prefs.telegram.orderUpdates}
              onChange={(v) => patchTelegram('orderUpdates', v)}
            />
            <ToggleRow
              label="Shipping and delivery"
              description="Dispatch and delivery pings on the day of shipping."
              on={prefs.telegram.shippingUpdates}
              onChange={(v) => patchTelegram('shippingUpdates', v)}
            />
            <ToggleRow
              label="AV Care"
              description="Claim assessment and resolution updates."
              on={prefs.telegram.avCareUpdates}
              onChange={(v) => patchTelegram('avCareUpdates', v)}
              isLast
            />
          </>
        )}
      </ChannelBlock>

      {/* Quiet hours */}
      <ChannelBlock
        number="04"
        title="Quiet"
        titleItalic="hours"
        endMeta={{
          kind: prefs.quietHours.enabled ? 'verified' : 'muted',
          text: prefs.quietHours.enabled
            ? `${fmtHour(prefs.quietHours.startHour)} — ${fmtHour(prefs.quietHours.endHour)}`
            : 'Off',
        }}
        isLast
      >
        <ToggleRow
          label="Pause push and Telegram overnight"
          description="Email still arrives but phone notifications are held until the window closes. Doesn't affect urgent build-ready alerts."
          on={prefs.quietHours.enabled}
          onChange={(v) => patchQuiet('enabled', v)}
          isLast={!prefs.quietHours.enabled}
        />

        {prefs.quietHours.enabled && (
          <div
            className="bav-quiet-range"
            style={{ padding: '20px 0', borderBottom: '1px solid var(--ink-10)' }}
          >
            <HourSelect
              label="From"
              value={prefs.quietHours.startHour}
              onChange={(v) => patchQuiet('startHour', v)}
            />
            <HourSelect
              label="Until"
              value={prefs.quietHours.endHour}
              onChange={(v) => patchQuiet('endHour', v)}
            />
          </div>
        )}
      </ChannelBlock>

      {/* Save row */}
      <div style={{ marginTop: 48, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bav-cta"
          style={{
            width: 'auto',
            padding: '18px 36px',
            opacity: saving ? 0.5 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--ink-60)',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
          }}
        >
          {savedMessage ?? 'Changes apply immediately'}
        </div>
      </div>
    </>
  );
}

function ChannelBlock({
  number,
  title,
  titleItalic,
  endMeta,
  children,
  isLast,
}: {
  number: string;
  title: string;
  titleItalic: string;
  endMeta: { kind: 'verified' | 'muted'; text: string };
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <section
      className="bav-channel-block"
      style={{
        borderTop: '1px solid var(--ink-10)',
        borderBottom: isLast ? '1px solid var(--ink-10)' : 'none',
        padding: '40px 0',
      }}
    >
      <div>
        <div
          className="font-display bav-italic"
          style={{ fontSize: 40, fontWeight: 300, lineHeight: 1, color: 'var(--ink)' }}
        >
          №{number}
        </div>
      </div>
      <div>
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
          <h2
            className="font-display"
            style={{ fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}
          >
            {title} <span className="bav-italic">{titleItalic}</span>
          </h2>
          <EndMeta meta={endMeta} />
        </div>
        {children}
      </div>
    </section>
  );
}

function EndMeta({ meta }: { meta: { kind: 'verified' | 'muted'; text: string } }) {
  const color = meta.kind === 'verified' ? '#1EB53A' : 'var(--ink-60)';
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--ink-10)',
        padding: '5px 10px',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {meta.kind === 'verified' && <span className="bav-pulse" aria-hidden="true" />}
      {meta.text}
    </span>
  );
}

function ToggleRow({
  label,
  description,
  on,
  onChange,
  isLast,
  disabled,
}: {
  label: string;
  description: string;
  on: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--ink-10)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5, maxWidth: 520 }}>
          {description}
        </div>
      </div>
      <Toggle on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 44,
        height: 24,
        border: `1px solid ${on ? 'var(--ink)' : 'var(--ink-30)'}`,
        borderRadius: 999,
        background: on ? 'var(--ink)' : 'transparent',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        transition: 'background 200ms, border-color 200ms',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: on ? 'var(--paper)' : 'var(--ink)',
          transition: 'left 200ms cubic-bezier(0.16, 1, 0.3, 1), background 200ms',
        }}
      />
    </button>
  );
}

function TelegramConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{ padding: '4px 0 0' }}>
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
        Get build-stage updates and shipping pings straight to Telegram — handy if you live out of your
        inbox. We&apos;ll send a one-time verification message to link your account.
      </p>

      <div
        style={{
          padding: '16px 20px',
          background: 'var(--paper-2)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <div style={{ color: 'var(--ink)', marginTop: 2, flexShrink: 0 }}>
          <TelegramIcon />
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.55 }}>
          <div
            className="font-mono"
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: 'var(--ink)',
              marginBottom: 6,
            }}
          >
            How it works
          </div>
          Open Telegram and message{' '}
          <span className="font-mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
            @BirminghamAVBot
          </span>
          . Paste the one-time code we&apos;ll show after you tap connect. Done — takes about ten seconds.
        </div>
      </div>

      <button
        type="button"
        onClick={onConnect}
        className="bav-cta"
        style={{ width: 'auto', padding: '16px 32px' }}
      >
        Connect Telegram
      </button>
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function HourSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div>
      <div
        className="font-mono"
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: 'var(--ink-60)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="font-mono"
        style={{
          fontSize: 22,
          padding: '6px 0',
          border: 'none',
          borderBottom: '1px solid var(--ink-30)',
          background: 'transparent',
          color: 'var(--ink)',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {fmtHour(h)}
          </option>
        ))}
      </select>
    </div>
  );
}

function fmtHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}
