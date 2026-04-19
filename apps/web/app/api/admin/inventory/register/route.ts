import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleError, ok, parseBody } from '@/lib/json';
import { registerComponent } from '@/lib/services/inventory';

const Body = z.object({
  qrId: z.string().min(1),
  componentType: z.string().min(1),
  manufacturer: z.string().trim().min(1),
  model: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1).optional(),
  conditionGrade: z.string().min(1),
  costGbp: z.number().nonnegative().optional(),
  supplier: z.string().trim().min(1).optional(),
  currentLocation: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

function currentUserId(): string | undefined {
  const session = cookies().get('bav_session')?.value;
  return session?.startsWith('user:') ? session.slice(5) : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Body);
    const { component, qr, movement } = await registerComponent({
      qrId: body.qrId,
      componentTypeCode: body.componentType,
      manufacturer: body.manufacturer,
      model: body.model,
      serialNumber: body.serialNumber,
      conditionGrade: body.conditionGrade,
      costGbp: body.costGbp,
      supplier: body.supplier,
      initialLocation: body.currentLocation,
      notes: body.notes,
      actorId: currentUserId(),
    });
    return ok({
      componentId: component.componentId,
      qrId: qr.qrId,
      movementId: movement.movementId,
    });
  } catch (err) {
    return handleError(err);
  }
}
