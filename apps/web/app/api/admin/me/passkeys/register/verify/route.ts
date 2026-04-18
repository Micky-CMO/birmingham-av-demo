import { headers } from 'next/headers';
import { z } from 'zod';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';
import {
  clearChallengeCookie,
  getRpInfo,
  readChallengeCookie,
} from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

/**
 * Step 2 of registration: verify the attestation returned by the authenticator,
 * then persist the new credential. We accept any well-formed RegistrationResponseJSON
 * rather than re-validating every nested base64url string; @simplewebauthn will reject
 * anything that doesn't verify cryptographically.
 */
const Schema = z.object({
  credential: z
    .object({
      id: z.string(),
      rawId: z.string(),
      type: z.literal('public-key'),
      response: z.object({
        clientDataJSON: z.string(),
        attestationObject: z.string(),
        transports: z.array(z.string()).optional(),
      }),
      clientExtensionResults: z.record(z.unknown()).optional(),
      authenticatorAttachment: z.string().optional(),
    })
    .passthrough(),
  nickname: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = await parseBody(request, Schema);

    const challengeCookie = readChallengeCookie();
    if (!challengeCookie || challengeCookie.type !== 'registration') {
      return bad(400, 'no active registration challenge');
    }
    if (challengeCookie.userId && challengeCookie.userId !== staff.userId) {
      // Session/user mismatch — ignore and force the user to restart.
      clearChallengeCookie();
      return bad(400, 'challenge does not match current session');
    }

    const { origin, rpID } = getRpInfo();

    const verification = await verifyRegistrationResponse({
      response: body.credential as RegistrationResponseJSON,
      expectedChallenge: challengeCookie.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    }).catch((err: unknown) => {
      console.error('[webauthn] registration verify failed', err);
      return { verified: false } as const;
    });

    if (!verification.verified || !verification.registrationInfo) {
      clearChallengeCookie();
      return bad(400, 'registration could not be verified');
    }

    const info = verification.registrationInfo;
    const credentialIdB64 = info.credential.id;

    // Defence in depth: make sure this credential isn't already attached to someone else
    const existing = await prisma.webauthnCredential.findUnique({
      where: { credentialId: credentialIdB64 },
      select: { userId: true },
    });
    if (existing) {
      clearChallengeCookie();
      return bad(409, 'passkey is already registered');
    }

    const publicKeyBuffer = Buffer.from(info.credential.publicKey);
    const transports = (info.credential.transports ?? []).map(String);

    await prisma.webauthnCredential.create({
      data: {
        credentialId: credentialIdB64,
        userId: staff.userId,
        publicKey: publicKeyBuffer,
        counter: BigInt(info.credential.counter ?? 0),
        transports,
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
        nickname: body.nickname ?? null,
      },
    });

    clearChallengeCookie();

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.passkey.enroll',
      entityType: 'user',
      entityId: staff.userId,
      payload: {
        credentialId: credentialIdB64,
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
      },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({
      credential: {
        credentialId: credentialIdB64,
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
        nickname: body.nickname ?? null,
      },
    });
  } catch (err) {
    clearChallengeCookie();
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
