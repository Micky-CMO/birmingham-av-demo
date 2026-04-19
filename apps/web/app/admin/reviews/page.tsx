import { prisma } from '@/lib/db';
import { ReviewsModeration, type AdminReviewRow } from '@/components/admin/ReviewsModeration';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reviews · Admin' };

function daysAgoIso(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export default async function AdminReviewsPage() {
  // Load the queue — pending + flagged prioritised, fallback to recent approved.
  const [pendingRows, flaggedRows, approvedRows, counts, avgAgg] = await Promise.all([
    prisma.review.findMany({
      where: { adminStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { title: true, slug: true, sku: true } },
      },
    }),
    prisma.review.findMany({
      where: { adminStatus: 'flagged' },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { title: true, slug: true, sku: true } },
      },
    }),
    prisma.review.findMany({
      where: { adminStatus: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { title: true, slug: true, sku: true } },
      },
    }),
    prisma.review.groupBy({
      by: ['adminStatus'],
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      where: { adminStatus: 'approved' },
    }),
  ]);

  const start30 = daysAgoIso(30);
  const approvedMonth = await prisma.review.count({
    where: { adminStatus: 'approved', updatedAt: { gte: start30 } },
  });

  const byStatus: Record<string, number> = {};
  for (const c of counts) byStatus[c.adminStatus] = c._count._all;

  const toRow = (r: (typeof pendingRows)[number]): AdminReviewRow => {
    const firstName = r.user.firstName ?? '';
    const lastName = r.user.lastName ?? '';
    const lastInitial = lastName ? lastName.slice(0, 1) + '.' : '';
    return {
      reviewId: r.reviewId,
      rating: r.rating,
      title: r.title,
      body: r.body,
      productTitle: r.product.title,
      productSlug: r.product.slug,
      productSku: r.product.sku,
      reviewerFirst: firstName || r.user.email.split('@')[0] || r.user.email,
      reviewerLastInitial: lastInitial,
      reviewerEmail: r.user.email,
      createdAt: r.createdAt.toISOString(),
      adminStatus: r.adminStatus,
      verifiedPurchase: r.verifiedPurchase,
      photoCount: Array.isArray(r.photoUrls) ? r.photoUrls.length : 0,
    };
  };

  const reviews: AdminReviewRow[] = [
    ...pendingRows.map(toRow),
    ...flaggedRows.map(toRow),
    ...approvedRows.map(toRow),
  ];

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <ReviewsModeration
        reviews={reviews}
        stats={{
          pending: byStatus.pending ?? 0,
          flagged: byStatus.flagged ?? 0,
          approvedMonth,
          averageRating: Number(avgAgg._avg.rating ?? 0),
        }}
      />
    </main>
  );
}
