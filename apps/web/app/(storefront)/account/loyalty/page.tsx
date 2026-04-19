import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { AccountShell } from '@/components/account/AccountShell';
import { LoyaltyDashboard, type LoyaltyHistoryEntry } from './LoyaltyDashboard';

export const metadata: Metadata = {
  title: 'Loyalty · Birmingham AV',
  description:
    'Earn points on every Birmingham AV order. Unlock early access, free delivery and priority AV Care at higher tiers.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_UPPER_BOUND: Record<TierKey, number> = {
  bronze: 1000,
  silver: 2000,
  gold: 5000,
  platinum: Number.POSITIVE_INFINITY,
};

const NEXT_TIER: Record<TierKey, TierKey | null> = {
  bronze: 'silver',
  silver: 'gold',
  gold: 'platinum',
  platinum: null,
};

export default async function LoyaltyPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/auth/login?next=/account/loyalty');

  // Ensure the loyalty account exists — create on first visit.
  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId: current.userId },
  });
  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId: current.userId },
    });
  }

  const [history, recent7d] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { accountId: account.accountId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.loyaltyTransaction.aggregate({
      where: {
        accountId: account.accountId,
        kind: 'earned',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      },
      _sum: { delta: true },
    }),
  ]);

  const tier = account.tier as TierKey;
  const nextTier = NEXT_TIER[tier];
  const nextThreshold = nextTier ? TIER_UPPER_BOUND[tier] : null;
  const pointsToNextTier = nextThreshold ? Math.max(0, nextThreshold - account.balance) : 0;
  const newPointsSince7d = recent7d._sum.delta ?? 0;

  const historyRows: LoyaltyHistoryEntry[] = history.map((h) => ({
    transactionId: h.transactionId,
    delta: h.delta,
    kind: h.kind,
    description: h.description,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <AccountShell activeKey="loyalty">
      <LoyaltyDashboard
        balance={account.balance}
        lifetimeEarned={account.lifetimeEarned}
        lifetimeRedeemed={account.lifetimeRedeemed}
        tier={tier}
        nextTier={nextTier}
        nextThreshold={nextThreshold}
        pointsToNextTier={pointsToNextTier}
        newPointsSince7d={newPointsSince7d}
        history={historyRows}
      />
    </AccountShell>
  );
}
