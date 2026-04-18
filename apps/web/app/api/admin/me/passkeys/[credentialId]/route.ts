import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  nickname: z.string().trim().min(1).max(80),
});

type Ctx = { params: { credentialId: string } };

/** PATCH — rename a passkey. Only the owner may mutate. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const staff = await requireStaff();
    const body = await parseBody(request, PatchSchema);

    // Ensure the credential belongs to the signed-in user before updating.
    const cred = await prisma.webauthnCredential.findUnique({
      where: { credentialId: params.credentialId },
      select: { userId: true },
    });
    if (!cred || cred.userId !== staff.userId) return bad(404, 'passkey not found');

    const updated = await prisma.webauthnCredential.update({
      where: { credentialId: params.credentialId },
      data: { nickname: body.nickname },
      select: {
        credentialId: true,
        nickname: true,
        deviceType: true,
        backedUp: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return ok({
      credential: {
        credentialId: updated.credentialId,
        nickname: updated.nickname,
        deviceType: updated.deviceType,
        backedUp: updated.backedUp,
        lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

/** DELETE — remove the passkey. Only the owner may remove. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const staff = await requireStaff();

    const cred = await prisma.webauthnCredential.findUnique({
      where: { credentialId: params.credentialId },
      select: { userId: true },
    });
    if (!cred || cred.userId !== staff.userId) return bad(404, 'passkey not found');

    await prisma.webauthnCredential.delete({
      where: { credentialId: params.credentialId },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.passkey.remove',
      entityType: 'user',
      entityId: staff.userId,
      payload: { credentialId: params.credentialId },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ removed: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
