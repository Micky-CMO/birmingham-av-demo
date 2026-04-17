import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseQuery } from '@/lib/json';

const Query = z.object({
  status: z.string().optional(),
  minSeverity: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const q = parseQuery(request, Query);
    const where = {
      ...(q.status ? { status: q.status as 'requested' } : {}),
      ...(q.minSeverity !== undefined ? { aiSeverity: { gte: q.minSeverity } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.return.count({ where }),
      prisma.return.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { builder: true, product: true },
      }),
    ]);
    return ok({
      items: rows.map((r) => ({
        returnNumber: r.returnNumber,
        reason: r.reason,
        status: r.status,
        product: r.product.title,
        builder: r.builder.displayName,
        builderCode: r.builder.builderCode,
        refundAmountGbp: Number(r.refundAmountGbp),
        aiSeverity: r.aiSeverity !== null ? Number(r.aiSeverity) : null,
        aiFlaggedPattern: r.aiFlaggedPattern,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    });
  } catch (err) {
    return handleError(err);
  }
}
