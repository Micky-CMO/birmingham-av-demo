import { ScanSubmitSchema } from '@bav/lib/schemas';
import { prisma } from '@/lib/db';
import { connectMongo, BuildEventLog } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { publishEvent } from '@/lib/events';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'builder') return bad(403, 'builders only');
    const body = await parseBody(request, ScanSubmitSchema);

    const unit = await prisma.unit.findUnique({ where: { unitId: body.unitId } });
    if (!unit) return bad(404, 'unit not found');

    await connectMongo();
    for (const ev of body.events) {
      await BuildEventLog.create({
        postgresUnitId: body.unitId,
        postgresBuilderId: unit.builderId,
        postgresOrderId: body.orderId,
        eventType: ev.eventType,
        components: ev.components,
        photos: ev.photos,
        builderDeviceId: body.deviceId,
        clientVersion: body.clientVersion,
      });
    }

    const completed = body.events.some((e) => e.eventType === 'build_completed');
    if (completed) {
      await prisma.unit.update({
        where: { unitId: body.unitId },
        data: { buildCompletedAt: new Date(), currentState: 'qc_pending' },
      });
      await publishEvent('bav.builds.completed', { unitId: body.unitId });
    }

    return ok({ accepted: body.events.length });
  } catch (err) {
    return handleError(err);
  }
}
