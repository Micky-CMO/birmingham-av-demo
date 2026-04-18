import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET — list the current user's enrolled passkeys (no public key material). */
export async function GET() {
  try {
    const staff = await requireStaff();
    const creds = await prisma.webauthnCredential.findMany({
      where: { userId: staff.userId },
      select: {
        credentialId: true,
        nickname: true,
        deviceType: true,
        backedUp: true,
        transports: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok({
      items: creds.map((c) => ({
        credentialId: c.credentialId,
        nickname: c.nickname,
        deviceType: c.deviceType,
        backedUp: c.backedUp,
        transports: c.transports,
        lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
