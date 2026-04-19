import { CreateReviewSchema } from '@bav/lib/schemas';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews
 *
 * Creates a review in `adminStatus = 'pending'` awaiting moderation.
 * Requires the caller is signed in and the `orderItemId` belongs to the
 * caller, the order is shipped or delivered, and the review `productId`
 * matches the product bought on that order item.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');

    const body = await parseBody(request, CreateReviewSchema);

    const item = await prisma.orderItem.findFirst({
      where: {
        orderItemId: body.orderItemId,
        productId: body.productId,
        order: { userId: user.userId, status: { in: ['shipped', 'delivered'] } },
      },
    });
    if (!item) return bad(403, 'reviews limited to verified purchases');

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        userId: user.userId,
        orderItemId: body.orderItemId,
        rating: body.rating,
        title: body.title ?? null,
        body: body.body,
        photoUrls: body.photoUrls,
        verifiedPurchase: true,
        adminStatus: 'pending',
      },
    });
    return ok({ reviewId: review.reviewId }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
