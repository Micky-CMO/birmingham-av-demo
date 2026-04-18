import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseQuery } from '@/lib/json';
import { requireStaff } from '@/lib/session';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['support_staff', 'admin', 'super_admin'] as const;

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
});

export async function GET(request: Request) {
  try {
    await requireStaff();
    const q = parseQuery(request, QuerySchema);

    const where = {
      role: { in: [...STAFF_ROLES] },
      ...(q.includeInactive ? {} : { deletedAt: null }),
    };

    const [total, rows, recentAudits] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          userId: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          mfaEnabled: true,
          lastLoginAt: true,
          deletedAt: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          action: { startsWith: 'admin.' },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          auditId: true,
          action: true,
          entityType: true,
          entityId: true,
          actorUserId: true,
          actorType: true,
          createdAt: true,
        },
      }),
    ]);

    return ok({
      items: rows.map((u) => ({
        userId: u.userId,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
        avatarUrl: u.avatarUrl,
        mfaEnabled: u.mfaEnabled,
        status: u.deletedAt ? 'inactive' : 'active',
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      auditLog: recentAudits.map((a) => ({
        auditId: a.auditId.toString(),
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actorUserId: a.actorUserId,
        actorType: a.actorType,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
