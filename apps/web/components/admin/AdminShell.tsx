import Link from 'next/link';
import { headers } from 'next/headers';

type NavKey =
  | 'dashboard'
  | 'orders'
  | 'builders'
  | 'returns'
  | 'support'
  | 'marketing'
  | 'products'
  | 'staff'
  | 'analytics'
  | 'payouts'
  | 'reports'
  | 'settings'
  | 'builder-portal'
  | 'inventory';

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { key: 'orders', label: 'Orders', href: '/admin/orders' },
  { key: 'builders', label: 'Builders', href: '/admin/builders' },
  { key: 'returns', label: 'Returns', href: '/admin/returns' },
  { key: 'support', label: 'Support', href: '/admin/support' },
  { key: 'marketing', label: 'Marketing', href: '/admin/discounts' },
  { key: 'products', label: 'Products', href: '/admin/products' },
  { key: 'staff', label: 'Staff', href: '/admin/staff' },
  { key: 'analytics', label: 'Analytics', href: '/admin/analytics' },
  { key: 'payouts', label: 'Payouts', href: '/admin/payouts' },
  { key: 'reports', label: 'Reports', href: '/admin/reports' },
  { key: 'settings', label: 'Settings', href: '/admin/settings' },
];

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
  if (path.includes('/admin/support')) return 'support';
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
  if (path.includes('/admin/payouts')) return 'payouts';
  if (path.includes('/admin/reports')) return 'reports';
  if (path.includes('/admin/settings')) return 'settings';
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
        <Link href="/admin/dashboard" className="flex items-baseline gap-[14px]">
          <span className="bav-admin-nav-wordmark">Birmingham AV</span>
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            / Admin
          </span>
        </Link>
        <div className="bav-admin-nav-links">
          {NAV.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className={'bav-tab-link' + (active === it.key ? ' active' : '')}
            >
              {it.label}
            </Link>
          ))}
        </div>
        <div className="bav-admin-nav-util">
          <span className="bav-pulse" title="Systems nominal" />
          <span className="bav-label hidden sm:inline" style={{ color: 'var(--ink-60)' }}>
            {initials} · {role.replace('_', ' ')}
          </span>
          <div className="bav-admin-avatar">{initials}</div>
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
