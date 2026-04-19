import { prisma } from '@/lib/db';
import { ReturnsTable, type AdminReturn } from '@/components/admin/ReturnsTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Returns · Admin' };

export default async function AdminReturnsPage() {
  const [rows, statusCounts, totalReturns, totalOrders] = await Promise.all([
    prisma.return.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { title: true, sku: true } },
        builder: { select: { displayName: true, builderCode: true } },
        requestedByUser: { select: { email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.return.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.return.count(),
    prisma.order.count({ where: { status: { not: 'draft' } } }),
  ]);

  const returns: AdminReturn[] = rows.map((r) => ({
    returnId: r.returnId,
    returnNumber: r.returnNumber,
    orderNumber: r.order.orderNumber,
    customerName:
      [r.requestedByUser.firstName, r.requestedByUser.lastName].filter(Boolean).join(' ') ||
      r.requestedByUser.email,
    customerEmail: r.requestedByUser.email,
    productTitle: r.product.title,
    productSku: r.product.sku,
    builderCode: r.builder?.builderCode ?? null,
    builderName: r.builder?.displayName ?? null,
    reason: r.reason,
    reasonDetails: r.reasonDetails,
    refundAmountGbp: Number(r.refundAmountGbp),
    restockingFeeGbp: Number(r.restockingFeeGbp),
    aiSeverity: r.aiSeverity === null ? null : Number(r.aiSeverity),
    aiFlaggedPattern: r.aiFlaggedPattern,
    aiSummary:
      r.aiAnalysis && typeof r.aiAnalysis === 'object' && 'summary' in r.aiAnalysis
        ? String((r.aiAnalysis as { summary?: unknown }).summary ?? '')
        : null,
    aiConfidence:
      r.aiAnalysis && typeof r.aiAnalysis === 'object' && 'confidence' in r.aiAnalysis
        ? Number((r.aiAnalysis as { confidence?: unknown }).confidence)
        : null,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    photoCount: 0,
  }));

  const counts: Record<string, number> = {};
  for (const c of statusCounts) counts[c.status] = c._count._all;

  const rmaRate = totalOrders > 0 ? totalReturns / totalOrders : 0;

  return <ReturnsTable returns={returns} counts={counts} rmaRate={rmaRate} />;
}
