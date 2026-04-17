import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseQuery } from '@/lib/json';

const Schema = z.object({ q: z.string().min(1).max(100), limit: z.coerce.number().int().min(1).max(20).default(10) });

export async function GET(request: Request) {
  try {
    const { q, limit } = parseQuery(request, Schema);
    const results = await prisma.product.findMany({
      where: { isActive: true, title: { contains: q, mode: 'insensitive' } },
      take: limit,
      select: { slug: true, title: true, priceGbp: true, conditionGrade: true },
    });
    return ok({ results: results.map((r) => ({ ...r, priceGbp: Number(r.priceGbp) })) });
  } catch (err) {
    return handleError(err);
  }
}
