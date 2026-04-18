import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PatchSchema = z
  .object({
    role: z.enum(['support_staff', 'admin', 'super_admin']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: 'must supply role or status',
  });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges to modify staff');
    }

    const body = await parseBody(request, PatchSchema);
    const target = await prisma.user.findUnique({
      where: { userId: params.id },
      select: { userId: true, role: true, deletedAt: true },
    });
    if (!target) return bad(404, 'staff user not found');

    // Only super-admins can change roles to/from super_admin.
    if (
      (body.role === 'super_admin' || target.role === 'super_admin') &&
      staff.role !== 'super_admin'
    ) {
      return bad(403, 'only super-admin can change super-admin roles');
    }

    // Never allow a user to deactivate themselves.
    if (body.status === 'inactive' && target.userId === staff.userId) {
      return bad(400, 'you cannot deactivate your own account');
    }

    const data: Record<string, unknown> = {};
    if (body.role) data.role = body.role;
    if (body.status === 'inactive') data.deletedAt = new Date();
    if (body.status === 'active') data.deletedAt = null;

    const updated = await prisma.user.update({
      where: { userId: params.id },
      data,
      select: {
        userId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
      },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.staff.update',
      entityType: 'user',
      entityId: params.id,
      payload: {
        previousRole: target.role,
        newRole: body.role ?? target.role,
        statusChange: body.status,
      },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({
      user: {
        userId: updated.userId,
        email: updated.email,
        role: updated.role,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.deletedAt ? 'inactive' : 'active',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
