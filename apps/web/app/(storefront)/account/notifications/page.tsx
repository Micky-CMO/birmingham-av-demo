import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { NotificationPanels, type NotificationPrefs } from './NotificationPanels';

export const metadata: Metadata = {
  title: 'Notifications',
  description:
    'Choose how Birmingham AV reaches you — email, browser push, Telegram relay, and quiet hours.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AccountNotificationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/account/notifications');

  const [user, avSub] = await Promise.all([
    prisma.user.findUnique({
      where: { userId: current.userId },
      select: { email: true, emailVerifiedAt: true },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);
  if (!user) redirect('/auth/login');

  // The current schema has no per-channel notification prefs; default all
  // emails on, push/telegram off. A future migration adds a JSON column.
  const initial: NotificationPrefs = {
    email: {
      address: user.email,
      verified: !!user.emailVerifiedAt,
      orderUpdates: true,
      shippingUpdates: true,
      avCareUpdates: true,
      journalDigest: false,
      marketing: false,
    },
    push: {
      browserEnabled: false,
      orderUpdates: false,
      shippingUpdates: false,
      avCareUpdates: false,
    },
    telegram: {
      connected: false,
      handle: null,
      orderUpdates: false,
      shippingUpdates: false,
      avCareUpdates: false,
    },
    quietHours: {
      enabled: false,
      startHour: 22,
      endHour: 8,
    },
  };

  return (
    <AccountShell activeKey="notifications" avCareStatus={avSub?.status ?? null}>
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
        <span className="bav-italic">Notifications</span>.
      </h1>
      <p
        style={{
          margin: 0,
          marginBottom: 56,
          color: 'var(--ink-60)',
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 520,
        }}
      >
        Choose how we reach you. Order and build updates are on by default so you don&apos;t miss the
        handover — everything else is opt-in.
      </p>

      <NotificationPanels initial={initial} />

      <div
        style={{
          marginTop: 64,
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
