import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { AddressesManager, type AccountAddress } from './AddressesManager';

export const metadata: Metadata = {
  title: 'Addresses',
  description:
    'Manage your saved shipping and billing addresses for one-click checkout at Birmingham AV.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AccountAddressesPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/account/addresses');

  const [user, avSub] = await Promise.all([
    prisma.user.findUnique({
      where: { userId: current.userId },
      select: { email: true, firstName: true, lastName: true },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);
  if (!user) redirect('/auth/login');

  const addresses = await prisma.userAddress.findMany({
    where: { userId: current.userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  const serialised: AccountAddress[] = addresses.map((a) => ({
    addressId: a.addressId,
    label: a.label,
    recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    region: a.region,
    postcode: a.postcode,
    countryIso2: a.countryIso2,
    phone: null,
    isDefaultShipping: a.isDefault,
    isDefaultBilling: a.isDefault,
  }));

  return (
    <AccountShell activeKey="addresses" avCareStatus={avSub?.status ?? null}>
      <h1
        className="font-display"
        style={{
          fontWeight: 300,
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          margin: 0,
          marginBottom: 12,
        }}
      >
        Your <span className="bav-italic">addresses</span>.
      </h1>
      <p
        style={{
          margin: 0,
          marginBottom: 48,
          color: 'var(--ink-60)',
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 520,
        }}
      >
        Shipping and billing destinations. Your default shipping address is pre-filled at checkout; the
        default billing address is used on invoices and VAT receipts.
      </p>

      <AddressesManager initial={serialised} />

      <div
        style={{
          marginTop: 96,
          paddingTop: 32,
          borderTop: '1px solid var(--ink-10)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div className="bav-label" style={{ color: 'var(--ink-30)' }}>
          Signed in as {user.email}
        </div>
        <a
          href="/auth/signout"
          className="bav-hover-opa bav-label"
          style={{ color: 'var(--ink-30)', textDecoration: 'none' }}
        >
          Sign out →
        </a>
      </div>
    </AccountShell>
  );
}
