import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const TIER_RATE_BP: Record<string, number> = {
  probation: 1000, // 10.0%
  standard: 1200, // 12.0%
  preferred: 1400, // 14.0%
  elite: 1600, // 16.0%
};

const RunSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export async function GET() {
  try {
    await requireStaff();
    const rows = await prisma.builderPayout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const builderIds = Array.from(new Set(rows.map((r) => r.builderId)));
    const builders = builderIds.length
      ? await prisma.builder.findMany({
          where: { builderId: { in: builderIds } },
          select: {
            builderId: true,
            builderCode: true,
            displayName: true,
            tier: true,
          },
        })
      : [];
    const builderMap = new Map(builders.map((b) => [b.builderId, b]));

    return ok({
      items: rows.map((r) => {
        const b = builderMap.get(r.builderId);
        return {
          payoutId: r.payoutId,
          builderId: r.builderId,
          builderCode: b?.builderCode ?? '—',
          builderName: b?.displayName ?? '—',
          tier: b?.tier ?? 'standard',
          periodStart: r.periodStart.toISOString(),
          periodEnd: r.periodEnd.toISOString(),
          totalBuildsCompleted: r.totalBuildsCompleted,
          totalRevenueGbp: Number(r.totalRevenueGbp),
          commissionRateBp: r.commissionRateBp,
          commissionGbp: Number(r.commissionGbp),
          status: r.status,
          paidAt: r.paidAt?.toISOString() ?? null,
          stripeTransferId: r.stripeTransferId,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges');
    }
    const body = await parseBody(request, RunSchema);

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    if (periodEnd <= periodStart) {
      return bad(400, 'periodEnd must be after periodStart');
    }

    // Find completed builds in the window (BuildQueue.status = 'completed', completedAt in window).
    const completedBuilds = await prisma.buildQueue.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: periodStart, lt: periodEnd },
      },
      select: {
        builderId: true,
        orderId: true,
      },
    });

    // Group by builder and compute revenue from OrderItem rows.
    const byBuilder = new Map<string, { builds: number; orderIds: Set<string> }>();
    for (const b of completedBuilds) {
      const entry = byBuilder.get(b.builderId) ?? { builds: 0, orderIds: new Set<string>() };
      entry.builds += 1;
      entry.orderIds.add(b.orderId);
      byBuilder.set(b.builderId, entry);
    }

    // Pull builder tier for rate lookup.
    const builderIds = Array.from(byBuilder.keys());
    const builders = builderIds.length
      ? await prisma.builder.findMany({
          where: { builderId: { in: builderIds } },
          select: { builderId: true, tier: true },
        })
      : [];
    const tierMap = new Map(builders.map((b) => [b.builderId, b.tier as string]));

    // Sum revenue per builder from OrderItems matching the builder in those orders.
    const created: string[] = [];
    for (const [builderId, info] of byBuilder.entries()) {
      const items = await prisma.orderItem.findMany({
        where: {
          builderId,
          orderId: { in: Array.from(info.orderIds) },
        },
        select: { pricePerUnitGbp: true, qty: true },
      });
      const revenue = items.reduce(
        (sum, it) => sum + Number(it.pricePerUnitGbp) * it.qty,
        0
      );
      const rateBp = TIER_RATE_BP[tierMap.get(builderId) ?? 'standard'] ?? 1200;
      const commission = Math.round(revenue * (rateBp / 10_000) * 100) / 100;

      const payout = await prisma.builderPayout.create({
        data: {
          builderId,
          periodStart,
          periodEnd,
          totalBuildsCompleted: info.builds,
          totalRevenueGbp: revenue,
          commissionRateBp: rateBp,
          commissionGbp: commission,
          status: 'pending',
        },
      });
      created.push(payout.payoutId);
    }

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.payouts.run',
      entityType: 'builder_payout_run',
      entityId: `${periodStart.toISOString()}_${periodEnd.toISOString()}`,
      payload: { createdCount: created.length },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ created: created.length, payoutIds: created });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
