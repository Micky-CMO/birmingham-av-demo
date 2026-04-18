import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { verifyTotp } from '@/lib/totp';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  code: z.string().trim().min(6).max(10),
});

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = await parseBody(request, Schema);

    const user = await prisma.user.findUnique({
      where: { userId: staff.userId },
      select: { mfaSecret: true },
    });
    if (!user?.mfaSecret) return bad(400, 'no pending MFA enrolment: call enroll first');
    if (!verifyTotp(user.mfaSecret, body.code)) return bad(401, 'invalid code');

    await prisma.user.update({
      where: { userId: staff.userId },
      data: { mfaEnabled: true },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.mfa.enable',
      entityType: 'user',
      entityId: staff.userId,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ mfaEnabled: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
