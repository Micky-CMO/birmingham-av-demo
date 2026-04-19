import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

const CreateClaimSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  reason: z.enum([
    'hardware_fault',
    'performance_degradation',
    'cosmetic_damage',
    'accidental',
    'other',
  ]),
  description: z.string().min(20).max(4000),
  photoUrls: z.array(z.string().url()).max(10).default([]),
});

/**
 * Format an AV Care claim number as `AVC-NNNNNN`. Counted from the current
 * row total + 1, zero-padded to six digits. Good enough as a human-readable
 * handle; uniqueness is enforced at the DB layer.
 */
async function nextClaimNumber(): Promise<string> {
  const count = await prisma.avCareClaim.count();
  return `AVC-${String(count + 1).padStart(6, '0')}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');

    const body = await parseBody(request, CreateClaimSchema);

    const subscription = await prisma.avCareSubscription.findUnique({
      where: { userId: user.userId },
      select: { subscriptionId: true, status: true },
    });
    if (!subscription) return bad(403, 'no active AV Care subscription');
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return bad(403, 'subscription is not active');
    }

    const claim = await prisma.avCareClaim.create({
      data: {
        claimNumber: await nextClaimNumber(),
        subscriptionId: subscription.subscriptionId,
        userId: user.userId,
        productId: body.productId,
        unitId: body.unitId ?? null,
        reason: body.reason,
        description: body.description,
        photoUrls: body.photoUrls,
      },
      select: { claimNumber: true },
    });

    return ok({ claimNumber: claim.claimNumber }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
