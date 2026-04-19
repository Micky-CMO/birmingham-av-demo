import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleError, ok, parseBody } from '@/lib/json';
import {
  bindComponentToBuild,
  moveComponent,
  unbindComponent,
  writeOffComponent,
  returnToStock,
} from '@/lib/services/inventory';

const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('moved').optional(),
    qrId: z.string().min(1),
    toLocation: z.string().trim().min(1),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal('bound_to_build'),
    qrId: z.string().min(1),
    unitId: z.string().min(1),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal('unbound'),
    qrId: z.string().min(1),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal('written_off'),
    qrId: z.string().min(1),
    reason: z.string().trim().min(1),
  }),
  z.object({
    action: z.literal('returned_to_stock'),
    qrId: z.string().min(1),
    toLocation: z.string().trim().min(1),
    notes: z.string().optional(),
  }),
]);

function currentUserId(): string | undefined {
  const session = cookies().get('bav_session')?.value;
  return session?.startsWith('user:') ? session.slice(5) : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Body);
    const actorId = currentUserId();

    if (body.action === 'bound_to_build') {
      const movement = await bindComponentToBuild({
        qrId: body.qrId,
        unitId: body.unitId,
        notes: body.notes,
        actorId,
      });
      return ok({ movementId: movement.movementId });
    }
    if (body.action === 'unbound') {
      const movement = await unbindComponent({
        qrId: body.qrId,
        notes: body.notes,
        actorId,
      });
      return ok({ movementId: movement.movementId });
    }
    if (body.action === 'written_off') {
      const movement = await writeOffComponent({
        qrId: body.qrId,
        reason: body.reason,
        actorId,
      });
      return ok({ movementId: movement.movementId });
    }
    if (body.action === 'returned_to_stock') {
      const movement = await returnToStock({
        qrId: body.qrId,
        toLocation: body.toLocation,
        notes: body.notes,
        actorId,
      });
      return ok({ movementId: movement.movementId });
    }

    // Default: plain move
    const movement = await moveComponent({
      qrId: body.qrId,
      toLocation: body.toLocation,
      notes: body.notes,
      actorId,
    });
    return ok({ movementId: movement.movementId });
  } catch (err) {
    return handleError(err);
  }
}
