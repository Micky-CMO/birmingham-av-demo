import { prisma } from '@/lib/db';

/** Convenience wrapper around prisma.auditLog.create — swallows errors so a failed audit never blocks the action. */
export async function writeAudit(input: {
  actorUserId?: string | null;
  actorType?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? 'staff',
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: (input.payload ?? undefined) as never,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write', input.action, err);
  }
}
