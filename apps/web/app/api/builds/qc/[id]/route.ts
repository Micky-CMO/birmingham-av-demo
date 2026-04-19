import { z } from 'zod';
import { prisma } from '@/lib/db';
import { connectMongo, BuildEventLog } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  unitId: z.string().uuid(),
  items: z.array(z.object({ code: z.string(), label: z.string(), passed: z.boolean(), notes: z.string().optional() })),
  notes: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !['builder', 'support_staff', 'admin', 'super_admin'].includes(user.role)) {
      return bad(403, 'not allowed');
    }
    const body = await parseBody(request, Schema);
    const allPassed = body.items.every((i) => i.passed);
    await prisma.unit.update({
      where: { unitId: body.unitId },
      data: {
        qcPassedAt: allPassed ? new Date() : null,
        qcPassedById: allPassed ? user.userId : null,
        qcNotes: body.notes ?? null,
        currentState: allPassed ? 'ready_to_ship' : 'qc_failed',
      },
    });
    await connectMongo();
    await BuildEventLog.create({
      postgresUnitId: body.unitId,
      postgresBuilderId: params.id,
      eventType: allPassed ? 'qc_passed' : 'qc_failed',
      qcItems: body.items,
    });
    return ok({ unitId: body.unitId, passed: allPassed });
  } catch (err) {
    return handleError(err);
  }
}
