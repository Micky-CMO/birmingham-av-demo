import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const rows = await prisma.productCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok({ items: rows.map((r) => ({ slug: r.slug, name: r.name, parentId: r.parentId })) });
  } catch (err) {
    return handleError(err);
  }
}
