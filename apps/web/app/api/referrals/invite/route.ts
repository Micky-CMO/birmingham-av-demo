import { randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
});

function makeCode(firstName: string | null, userId: string) {
  const slug = (firstName ?? 'friend').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) || 'friend';
  const suffix = randomBytes(3).toString('hex');
  const uid = userId.slice(0, 4);
  return `${slug}-${uid}${suffix}`.slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) return bad(401, 'not authenticated');

    const { email } = await parseBody(request, schema);

    let code = await prisma.referralCode.findUnique({ where: { userId: current.userId } });
    if (!code) {
      const user = await prisma.user
        .findUnique({ where: { userId: current.userId }, select: { firstName: true } })
        .catch(() => null);
      code = await prisma.referralCode.create({
        data: {
          userId: current.userId,
          code: makeCode(user?.firstName ?? null, current.userId),
        },
      });
    }

    const referral = await prisma.referral.create({
      data: {
        codeId: code.codeId,
        referrerUserId: current.userId,
        referredEmail: email,
        status: 'invited',
      },
    });

    return ok(
      {
        referral: {
          referralId: referral.referralId,
          codeId: referral.codeId,
          referredEmail: referral.referredEmail,
          status: referral.status,
          createdAt: referral.createdAt.toISOString(),
        },
        code: { code: code.code },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
