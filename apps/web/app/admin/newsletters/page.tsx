import { prisma } from '@/lib/db';
import { NewsletterComposer, type CampaignRow } from '@/components/admin/NewsletterComposer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Newsletters · Admin' };

const SEGMENT_LABELS: Record<string, string> = {
  all: 'All customers',
  trade: 'Trade accounts',
  avcare: 'AV Care subscribers',
  lapsed: 'Lapsed (90d)',
};

export default async function AdminNewslettersPage() {
  const rows = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const campaigns: CampaignRow[] = rows.map((r) => ({
    campaignId: r.campaignId,
    subject: r.subject,
    preheader: (r.text.split('\n')[0] ?? '').slice(0, 120),
    segmentLabel: SEGMENT_LABELS[r.recipientSegment] ?? r.recipientSegment,
    segmentKey: r.recipientSegment,
    status: r.status,
    recipients: r.sentCount,
    opens: r.openCount,
    clicks: r.clickCount,
    scheduledFor: r.scheduledFor?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  // Segment counts — best-effort, cheap queries.
  const [allCount, avCareCount, businessCount] = await Promise.all([
    prisma.user.count({ where: { role: 'customer', deletedAt: null } }),
    prisma.avCareSubscription.count({
      where: { status: { in: ['trialing', 'active', 'past_due'] } },
    }),
    prisma.businessAccount.count({ where: { status: 'active' } }).catch(() => 0),
  ]);

  const segments = [
    { k: 'all', label: 'All customers', count: allCount },
    { k: 'trade', label: 'Trade accounts', count: businessCount },
    { k: 'avcare', label: 'AV Care subscribers', count: avCareCount },
    { k: 'lapsed', label: 'Lapsed (90d)', count: 0 },
  ];

  return <NewsletterComposer campaigns={campaigns} segments={segments} />;
}
