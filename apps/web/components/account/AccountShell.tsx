import type { ReactNode } from 'react';
import Link from 'next/link';

export type AccountSectionKey =
  | 'dashboard'
  | 'orders'
  | 'returns'
  | 'addresses'
  | 'av-care'
  | 'security'
  | 'notifications';

export type AvCareStatusValue =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | null;

export interface AccountShellProps {
  activeKey: AccountSectionKey;
  avCareStatus?: AvCareStatusValue;
  children: ReactNode;
}

const LINKS: Array<{ key: AccountSectionKey; label: string; href: string }> = [
  { key: 'dashboard', label: 'Dashboard', href: '/account' },
  { key: 'orders', label: 'Orders', href: '/account/orders' },
  { key: 'returns', label: 'Returns', href: '/account/returns' },
  { key: 'addresses', label: 'Addresses', href: '/account/addresses' },
  { key: 'av-care', label: 'AV Care', href: '/account/av-care' },
  { key: 'security', label: 'Security', href: '/account/security' },
  { key: 'notifications', label: 'Notifications', href: '/account/notifications' },
];

/**
 * Shared AccountShell used by every /account/* page (artefacts 13–20).
 *
 * - Sticky sidebar on desktop, horizontal scrolling tab bar on mobile.
 * - The AV Care nav entry shows a pulsing green dot when the subscription is
 *   trialing or active, and a flat red dot when payment is past due.
 * - Server-safe: no local state; all interactivity is deferred to child pages.
 */
export function AccountShell({ activeKey, avCareStatus = null, children }: AccountShellProps) {
  const avDot: 'green' | 'red' | null =
    avCareStatus === 'trialing' || avCareStatus === 'active'
      ? 'green'
      : avCareStatus === 'past_due'
        ? 'red'
        : null;

  return (
    <div className="bav-account-shell">
      {/* Desktop sidebar */}
      <aside className="bav-account-sidebar" aria-label="Account navigation">
        <div className="bav-label mb-7" style={{ color: 'var(--ink-60)' }}>
          — Account
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {LINKS.map((l) => {
            const isActive = l.key === activeKey;
            const isAvCare = l.key === 'av-care';
            return (
              <Link
                key={l.key}
                href={l.href}
                className="bav-hover-opa"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  lineHeight: 1.2,
                  color: isActive ? 'var(--ink)' : 'var(--ink-60)',
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none',
                }}
              >
                {l.label}
                {isAvCare && avDot === 'green' && <span className="bav-pulse" aria-hidden="true" />}
                {isAvCare && avDot === 'red' && <span className="bav-past-due-dot" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />
        <div
          style={{
            marginTop: 40,
            borderTop: '1px solid var(--ink-10)',
            paddingTop: 20,
          }}
        >
          <a
            href="/auth/signout"
            className="bav-hover-opa bav-label"
            style={{ color: 'var(--ink-30)', textDecoration: 'none' }}
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="bav-account-tabbar" aria-label="Account navigation">
        <div className="bav-account-tabbar-scroll">
          {LINKS.map((l) => {
            const isActive = l.key === activeKey;
            const isAvCare = l.key === 'av-care';
            return (
              <Link
                key={l.key}
                href={l.href}
                className="bav-account-tab"
                data-active={isActive || undefined}
                style={{ color: isActive ? 'var(--ink)' : 'var(--ink-60)' }}
              >
                <span>{l.label}</span>
                {isAvCare && avDot === 'green' && <span className="bav-pulse" aria-hidden="true" />}
                {isAvCare && avDot === 'red' && <span className="bav-past-due-dot" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main column */}
      <main className="bav-account-main">{children}</main>
    </div>
  );
}
