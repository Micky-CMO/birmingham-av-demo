import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const units = await prisma.unit.findMany({
      where: { builderId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: { select: { title: true, slug: true } } },
    });
    return ok({
      items: units.map((u) => ({
        unitId: u.unitId,
        serialNumber: u.serialNumber,
        productTitle: u.product.title,
        productSlug: u.product.slug,
        currentState: u.currentState,
        buildCompletedAt: u.buildCompletedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
