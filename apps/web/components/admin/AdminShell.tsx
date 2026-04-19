import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';

type NavKey =
  | 'dashboard'
  | 'orders'
  | 'workshop-floor'
  | 'builders'
  | 'returns'
  | 'support'
  | 'reviews'
  | 'marketing'
  | 'products'
  | 'payments'
  | 'staff'
  | 'analytics'
  | 'developers'
  | 'payouts'
  | 'reports'
  | 'settings'
  | 'profile'
  | 'builder-portal'
  | 'inventory';

type NavItem = { key: NavKey; label: string; href: string };

/**
 * Primary nav — always visible. Seven most-used day-to-day tabs.
 */
const PRIMARY_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { key: 'orders', label: 'Orders', href: '/admin/orders' },
  { key: 'products', label: 'Products', href: '/admin/products' },
  { key: 'payments', label: 'Payments', href: '/admin/payments' },
  { key: 'workshop-floor', label: 'Workshop', href: '/admin/workshop-floor' },
  { key: 'builders', label: 'Builders', href: '/admin/builders' },
  { key: 'support', label: 'Support', href: '/admin/support' },
];

/**
 * Secondary nav — under a "More" disclosure. Less frequent surfaces.
 */
const MORE_NAV: NavItem[] = [
  { key: 'returns', label: 'Returns', href: '/admin/returns' },
  { key: 'reviews', label: 'Reviews', href: '/admin/reviews' },
  { key: 'marketing', label: 'Marketing', href: '/admin/discounts' },
  { key: 'staff', label: 'Staff', href: '/admin/staff' },
  { key: 'analytics', label: 'Analytics', href: '/admin/analytics' },
  { key: 'payouts', label: 'Builder payouts', href: '/admin/payouts' },
  { key: 'developers', label: 'Developers', href: '/admin/webhooks' },
  { key: 'reports', label: 'Reports', href: '/admin/reports' },
  { key: 'settings', label: 'Settings', href: '/admin/settings' },
];

const NAV: NavItem[] = [...PRIMARY_NAV, ...MORE_NAV];

/**
 * Derive the active nav key from the current pathname. Uses the `x-pathname`
 * header populated by middleware, with a defensive fallback if absent.
 */
function activeKey(): NavKey | null {
  const path = headers().get('x-pathname') ?? headers().get('next-url') ?? '';
  if (path.includes('/admin/builder-portal')) return 'builder-portal';
  if (path.includes('/admin/inventory')) return 'inventory';
  if (path.includes('/admin/dashboard')) return 'dashboard';
  if (path.includes('/admin/orders')) return 'orders';
  if (path.includes('/admin/builders')) return 'builders';
  if (path.includes('/admin/returns')) return 'returns';
  if (path.includes('/admin/support') || path.includes('/admin/macros')) return 'support';
  if (path.includes('/admin/reviews')) return 'reviews';
  // Marketing cluster: discounts + newsletters + emails
  if (
    path.includes('/admin/discounts') ||
    path.includes('/admin/newsletters') ||
    path.includes('/admin/emails')
  )
    return 'marketing';
  if (path.includes('/admin/products')) return 'products';
  if (path.includes('/admin/staff')) return 'staff';
  if (path.includes('/admin/analytics')) return 'analytics';
  if (path.includes('/admin/webhooks')) return 'developers';
  if (path.includes('/admin/payouts')) return 'payouts';
  if (path.includes('/admin/reports')) return 'reports';
  if (path.includes('/admin/settings')) return 'settings';
  if (path.includes('/admin/profile')) return 'profile';
  if (path.includes('/admin/payments')) return 'payments';
  return null;
}

export function AdminNav({
  current,
  initials,
  role,
}: {
  current?: NavKey;
  initials: string;
  role: string;
}) {
  const active = current ?? activeKey();
  return (
    <nav className="bav-admin-nav">
      <div className="bav-admin-nav-inner">
        <Link href="/admin/dashboard" className="flex items-center gap-[14px]">
          <Image
            src="/brand/favicon-mark.png"
            alt="Birmingham AV"
            width={128}
            height={128}
            priority
            className="h-8 w-8"
          />
          <span className="bav-admin-nav-wordmark">Birmingham AV</span>
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            / Admin
          </span>
        </Link>
        <div className="bav-admin-nav-links">
          {PRIMARY_NAV.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className={'bav-tab-link' + (active === it.key ? ' active' : '')}
            >
              {it.label}
            </Link>
          ))}
          <details className="bav-admin-more">
            <summary
              className={
                'bav-tab-link bav-admin-more-summary' +
                (MORE_NAV.some((it) => it.key === active) ? ' active' : '')
              }
            >
              More
              <span aria-hidden className="bav-admin-more-caret">
                ▾
              </span>
            </summary>
            <div className="bav-admin-more-panel">
              {MORE_NAV.map((it) => (
                <Link
                  key={it.key}
                  href={it.href}
                  className={
                    'bav-admin-more-item' + (active === it.key ? ' active' : '')
                  }
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
        <div className="bav-admin-nav-util">
          <span className="bav-pulse" title="Systems nominal" />
          <details className="bav-admin-profile">
            <summary className="bav-admin-profile-summary">
              <span className="bav-label hidden sm:inline" style={{ color: 'var(--ink-60)' }}>
                {initials} · {role.replace('_', ' ')}
              </span>
              <div className="bav-admin-avatar">{initials}</div>
            </summary>
            <div className="bav-admin-profile-panel">
              <div className="bav-admin-profile-header">
                <div className="font-display" style={{ fontSize: 15, lineHeight: 1.2 }}>
                  {initials}
                </div>
                <div className="bav-label mt-1" style={{ color: 'var(--ink-60)' }}>
                  {role.replace('_', ' ')}
                </div>
              </div>
              <Link href="/admin/profile" className="bav-admin-profile-item">
                My profile
              </Link>
              <Link href="/admin/settings" className="bav-admin-profile-item">
                Settings
              </Link>
              <Link href="/" className="bav-admin-profile-item">
                Back to storefront
              </Link>
              <div className="bav-admin-profile-divider" />
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="bav-admin-profile-item bav-admin-profile-signout">
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}

export function AdminFooter() {
  const build = process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) ?? '7a4f2e9';
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
  const region = process.env.VERCEL_REGION ?? 'lhr1';
  const envDotColor =
    env === 'production' ? 'var(--accent)' : env === 'preview' ? '#F0B849' : 'var(--ink-60)';
  return (
    <footer className="bav-admin-footer">
      <div className="bav-admin-footer-inner">
        <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
          Birmingham AV · Staff console · v2.3.1
        </span>
        <span className="bav-label flex items-center gap-[10px]" style={{ color: 'var(--ink-30)' }}>
          <span>build · {build}</span>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: envDotColor,
            }}
          />
          <span>
            {env} · {region}
          </span>
        </span>
      </div>
    </footer>
  );
}
