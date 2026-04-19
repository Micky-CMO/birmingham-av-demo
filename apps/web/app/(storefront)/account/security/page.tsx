import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { SecurityPanels, type SecurityUser, type SecurityPasskey } from './SecurityPanels';

export const metadata: Metadata = {
  title: 'Account security',
  description:
    'Manage your password, two-factor authentication, passkeys and active sessions on Birmingham AV.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AccountSecurityPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/account/security');

  const [user, credentials, avSub] = await Promise.all([
    prisma.user.findUnique({
      where: { userId: current.userId },
      select: {
        email: true,
        mfaEnabled: true,
        emailVerifiedAt: true,
        updatedAt: true,
      },
    }),
    prisma.webauthnCredential.findMany({
      where: { userId: current.userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.avCareSubscription.findUnique({
      where: { userId: current.userId },
      select: { status: true },
    }),
  ]);
  if (!user) redirect('/auth/login');

  const serialisedUser: SecurityUser = {
    email: user.email,
    mfaEnabled: user.mfaEnabled,
    passwordLastChangedAt: user.updatedAt.toISOString(),
  };
  const passkeys: SecurityPasskey[] = credentials.map((c) => ({
    credentialId: c.credentialId,
    nickname: c.nickname ?? 'Passkey',
    createdAt: c.createdAt.toISOString(),
    lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
    platform: derivePlatform(c.transports),
  }));

  return (
    <AccountShell activeKey="security" avCareStatus={avSub?.status ?? null}>
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
        Account <span className="bav-italic">security</span>.
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
        Manage how you sign in — password, two-factor authentication, passkeys, and active sessions. Passkeys
        are strongly recommended; they&apos;re phishing-resistant and faster than a password.
      </p>

      <SecurityPanels user={serialisedUser} passkeys={passkeys} />

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

function derivePlatform(transports: string[]): 'macos' | 'ios' | 'other' {
  if (transports.includes('internal')) return 'macos';
  if (transports.includes('hybrid')) return 'ios';
  return 'other';
}
