import { CreateReviewSchema } from '@bav/lib/schemas';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const body = await parseBody(request, CreateReviewSchema);

    const item = await prisma.orderItem.findFirst({
      where: { orderItemId: body.orderItemId, order: { userId: user.userId, status: { in: ['shipped', 'delivered'] } } },
    });
    if (!item) return bad(403, 'reviews limited to verified purchases');

    const review = await prisma.review.create({
      data: {
        productId: item.productId,
        userId: user.userId,
        orderItemId: body.orderItemId,
        rating: body.rating,
        title: body.title ?? null,
        body: body.body,
        verifiedPurchase: true,
      },
    });
    return ok({ reviewId: review.reviewId }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
