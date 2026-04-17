import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseQuery } from '@/lib/json';

const Query = z.object({
  status: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const q = parseQuery(request, Query);
    const where = {
      ...(q.status ? { status: q.status as 'paid' } : { status: { not: 'draft' as 'draft' } }),
      ...(q.q ? { orderNumber: { contains: q.q } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
    ]);
    return ok({
      items: rows.map((o) => ({
        orderNumber: o.orderNumber,
        email: o.user.email,
        customerName: [o.user.firstName, o.user.lastName].filter(Boolean).join(' '),
        status: o.status,
        totalGbp: Number(o.totalGbp),
        createdAt: o.createdAt.toISOString(),
      })),
      total,
    });
  } catch (err) {
    return handleError(err);
  }
}
