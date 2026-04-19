import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  code: z.string().trim().min(2).max(40).toUpperCase(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().min(0).nullable().optional(),
  minSpend: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireStaff();
    const rows = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok({
      items: rows.map((r) => ({
        codeId: r.codeId,
        code: r.code,
        type: r.type,
        value: r.value === null ? null : Number(r.value),
        minSpend: r.minSpend === null ? null : Number(r.minSpend),
        maxUses: r.maxUses,
        usesCount: r.usesCount,
        startsAt: r.startsAt?.toISOString() ?? null,
        endsAt: r.endsAt?.toISOString() ?? null,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return new Response(
        JSON.stringify({ error: { message: 'insufficient privileges' } }),
        { status: 403 }
      );
    }
    const body = await parseBody(request, CreateSchema);

    // Validate value requirement matches type.
    if (body.type !== 'free_shipping' && (body.value === null || body.value === undefined)) {
      return new Response(
        JSON.stringify({ error: { message: 'value required for percentage/fixed discounts' } }),
        { status: 400 }
      );
    }

    const created = await prisma.discountCode.create({
      data: {
        code: body.code,
        type: body.type,
        value: body.type === 'free_shipping' ? 0 : (body.value ?? 0),
        minSpend: body.minSpend ?? null,
        maxUses: body.maxUses ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive,
      },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.discount.create',
      entityType: 'discount_code',
      entityId: created.codeId,
      payload: { code: created.code, type: created.type },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ codeId: created.codeId });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
