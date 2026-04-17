import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return ok({
      items: rows.map((a) => ({
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actorType: a.actorType,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
