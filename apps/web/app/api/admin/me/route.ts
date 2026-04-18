import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await requireStaff();
    const user = await prisma.user.findUnique({
      where: { userId: staff.userId },
      select: {
        userId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        mfaEnabled: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) return bad(404, 'user not found');
    return ok({
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        mfaEnabled: user.mfaEnabled,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

const PatchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().min(3).max(32).optional().or(z.literal('')),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    const body = await parseBody(request, PatchSchema);

    const data: Record<string, string | null> = {};
    if (body.firstName !== undefined) data.firstName = body.firstName || null;
    if (body.lastName !== undefined) data.lastName = body.lastName || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.bio !== undefined) data.bio = body.bio || null;

    const updated = await prisma.user.update({
      where: { userId: staff.userId },
      data,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
      },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.profile.update',
      entityType: 'user',
      entityId: staff.userId,
      payload: { changed: Object.keys(data) },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ user: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
