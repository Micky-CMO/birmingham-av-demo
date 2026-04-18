import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { buildOtpAuthUrl, generateBase32Secret } from '@/lib/totp';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ISSUER = 'Birmingham AV';

/**
 * Generate a fresh TOTP secret and store it on the user. MFA is not considered
 * enabled until the user submits a valid code to /api/admin/me/mfa/verify.
 * No QR image is generated server-side: the client renders the otpauth:// URL
 * with a QR component so we avoid a new dependency.
 */
export async function POST() {
  try {
    const staff = await requireStaff();
    const user = await prisma.user.findUnique({
      where: { userId: staff.userId },
      select: { email: true, firstName: true },
    });
    if (!user) return bad(404, 'user not found');

    const secret = generateBase32Secret(20);
    await prisma.user.update({
      where: { userId: staff.userId },
      data: { mfaSecret: secret, mfaEnabled: false },
    });

    const label = user.email;
    const otpauthUrl = buildOtpAuthUrl({ secret, label, issuer: ISSUER });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.mfa.enroll',
      entityType: 'user',
      entityId: staff.userId,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ secret, otpauthUrl, issuer: ISSUER, label });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
