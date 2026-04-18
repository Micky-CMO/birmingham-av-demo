import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const staff = await requireStaff();
    await prisma.user.update({
      where: { userId: staff.userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.mfa.disable',
      entityType: 'user',
      entityId: staff.userId,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ mfaEnabled: false });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
