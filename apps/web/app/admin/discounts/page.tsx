import { prisma } from '@/lib/db';
import { DiscountsManager, type DiscountRow } from '@/components/admin/DiscountsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discounts · Admin' };

export default async function AdminDiscountsPage() {
  const rows = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const codes: DiscountRow[] = rows.map((r) => ({
    codeId: r.codeId,
    code: r.code,
    type: r.type,
    value: r.value === null ? null : Number(r.value),
    minSpend: r.minSpend === null ? null : Number(r.minSpend),
    maxUses: r.maxUses,
    usesCount: r.usesCount,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    isActive: r.isActive,
  }));

  // KPIs — active count, rough redemption sum (all time, no month filter yet)
  const now = new Date();
  const activeCount = codes.filter((c) => {
    if (!c.isActive) return false;
    if (c.maxUses !== null && c.usesCount >= c.maxUses) return false;
    if (c.endsAt && new Date(c.endsAt) < now) return false;
    return true;
  }).length;

  const redemptionsMonth = codes.reduce((sum, c) => sum + c.usesCount, 0);

  // Revenue attribution is a TODO — we don't yet have OrderDiscount join.
  const revenueAttributed = 0;

  return (
    <DiscountsManager
      codes={codes}
      kpis={{ active: activeCount, redemptionsMonth, revenueAttributed }}
    />
  );
}
