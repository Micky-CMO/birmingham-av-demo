import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { slug: params.slug } });
    if (!product) return bad(404, 'not found');
    const reviews = await prisma.review.findMany({
      where: { productId: product.productId },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: { user: { select: { firstName: true } } },
    });
    return ok({
      reviews: reviews.map((r) => ({
        rating: r.rating,
        title: r.title,
        body: r.body,
        helpfulCount: r.helpfulCount,
        verifiedPurchase: r.verifiedPurchase,
        firstName: r.user.firstName,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
