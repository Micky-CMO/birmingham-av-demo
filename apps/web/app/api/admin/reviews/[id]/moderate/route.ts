import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  action: z.enum(['approve', 'reject', 'flag', 'pending']),
});

const actionToStatus = {
  approve: 'approved',
  reject: 'rejected',
  flag: 'flagged',
  pending: 'pending',
} as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { action } = await parseBody(request, bodySchema);
    const updated = await prisma.review.update({
      where: { reviewId: params.id },
      data: { adminStatus: actionToStatus[action] },
      select: {
        reviewId: true,
        adminStatus: true,
        rating: true,
        title: true,
        updatedAt: true,
      },
    });
    return ok({
      review: {
        reviewId: updated.reviewId,
        adminStatus: updated.adminStatus,
        rating: updated.rating,
        title: updated.title,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2025') {
      return bad(404, 'review not found');
    }
    return handleError(err);
  }
}
