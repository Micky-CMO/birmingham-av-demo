import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = await parseBody(request, Schema);

    const user = await prisma.user.findUnique({
      where: { userId: staff.userId },
      select: { userId: true, passwordHash: true },
    });
    if (!user?.passwordHash) return bad(400, 'no existing password on record');

    const looksBcrypt = user.passwordHash.startsWith('$2');
    const valid = looksBcrypt
      ? await bcrypt.compare(body.currentPassword, user.passwordHash)
      : user.passwordHash ===
        (await import('node:crypto')).createHash('sha256').update(body.currentPassword).digest('hex');
    if (!valid) return bad(401, 'current password is incorrect');

    if (body.newPassword === body.currentPassword) {
      return bad(400, 'new password must differ from current password');
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { userId: staff.userId }, data: { passwordHash: newHash } });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.password.change',
      entityType: 'user',
      entityId: staff.userId,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
