import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  isActive: z.boolean().optional(),
  code: z.string().trim().min(2).max(40).toUpperCase().optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
  value: z.number().min(0).nullable().optional(),
  minSpend: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges to modify discount codes');
    }
    const body = await parseBody(request, PatchSchema);
    const target = await prisma.discountCode.findUnique({ where: { codeId: params.id } });
    if (!target) return bad(404, 'discount code not found');

    const data: Record<string, unknown> = {};
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.code !== undefined) data.code = body.code;
    if (body.type !== undefined) data.type = body.type;
    if (body.value !== undefined) data.value = body.value ?? 0;
    if (body.minSpend !== undefined) data.minSpend = body.minSpend;
    if (body.maxUses !== undefined) data.maxUses = body.maxUses;
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;

    const updated = await prisma.discountCode.update({
      where: { codeId: params.id },
      data,
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.discount.update',
      entityType: 'discount_code',
      entityId: params.id,
      payload: { changes: body },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ codeId: updated.codeId, isActive: updated.isActive });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges to delete discount codes');
    }
    const target = await prisma.discountCode.findUnique({ where: { codeId: params.id } });
    if (!target) return bad(404, 'discount code not found');

    await prisma.discountCode.delete({ where: { codeId: params.id } });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.discount.delete',
      entityType: 'discount_code',
      entityId: params.id,
      payload: { code: target.code },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ deleted: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
