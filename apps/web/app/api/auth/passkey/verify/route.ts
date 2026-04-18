import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { writeAudit } from '@/lib/audit';
import {
  STAFF_ROLES,
  clearChallengeCookie,
  getRpInfo,
  readChallengeCookie,
} from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint: verify an authenticator assertion. On success we rotate the
 * credential counter, stamp lastUsedAt, and issue the bav_session cookie the
 * rest of the app reads via getCurrentUser().
 */
const Schema = z.object({
  credential: z
    .object({
      id: z.string(),
      rawId: z.string(),
      type: z.literal('public-key'),
      response: z.object({
        clientDataJSON: z.string(),
        authenticatorData: z.string(),
        signature: z.string(),
        userHandle: z.string().optional(),
      }),
      clientExtensionResults: z.record(z.unknown()).optional(),
      authenticatorAttachment: z.string().optional(),
    })
    .passthrough(),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const challengeCookie = readChallengeCookie();
    if (!challengeCookie || challengeCookie.type !== 'authentication') {
      return bad(400, 'no active authentication challenge');
    }

    const credentialIdB64 = body.credential.id;
    const stored = await prisma.webauthnCredential.findUnique({
      where: { credentialId: credentialIdB64 },
      include: {
        user: {
          select: { userId: true, role: true, email: true, deletedAt: true },
        },
      },
    });

    if (!stored || stored.user.deletedAt) {
      clearChallengeCookie();
      return bad(404, 'passkey not recognised');
    }

    // If the challenge was scoped to a specific user (email supplied at options
    // time) make sure the credential returned belongs to that user.
    if (challengeCookie.userId && challengeCookie.userId !== stored.userId) {
      clearChallengeCookie();
      return bad(400, 'passkey does not belong to the requested account');
    }

    const { origin, rpID } = getRpInfo();

    const verification = await verifyAuthenticationResponse({
      response: body.credential as AuthenticationResponseJSON,
      expectedChallenge: challengeCookie.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credentialId,
        publicKey: new Uint8Array(stored.publicKey),
        counter: Number(stored.counter),
        transports: stored.transports as (
          | 'internal'
          | 'hybrid'
          | 'usb'
          | 'nfc'
          | 'ble'
          | 'cable'
          | 'smart-card'
        )[],
      },
      requireUserVerification: false,
    }).catch((err: unknown) => {
      console.error('[webauthn] authentication verify failed', err);
      return { verified: false } as const;
    });

    if (!verification.verified) {
      clearChallengeCookie();
      return bad(401, 'passkey verification failed');
    }

    const authInfo =
      'authenticationInfo' in verification ? verification.authenticationInfo : null;

    // Rotate the counter + stamp lastUsedAt. Failure here must not block sign-in,
    // but we must log it because a stuck counter weakens replay protection.
    try {
      await prisma.webauthnCredential.update({
        where: { credentialId: stored.credentialId },
        data: {
          counter: BigInt(authInfo?.newCounter ?? Number(stored.counter)),
          lastUsedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('[webauthn] failed to update credential counter', err);
    }

    await prisma.user
      .update({ where: { userId: stored.userId }, data: { lastLoginAt: new Date() } })
      .catch(() => null);

    clearChallengeCookie();

    // Issue session cookie. Match the format the rest of the app expects:
    // `user:{userId}` read by lib/session.ts.
    const store = cookies();
    store.set('bav_session', `user:${stored.userId}`, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
    if (STAFF_ROLES.has(stored.user.role)) {
      store.set('bav_staff', '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    const hdrs = headers();
    await writeAudit({
      actorUserId: stored.userId,
      actorType: STAFF_ROLES.has(stored.user.role) ? 'staff' : 'customer',
      action: 'auth.passkey.success',
      entityType: 'user',
      entityId: stored.userId,
      payload: { credentialId: stored.credentialId },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ userId: stored.userId, role: stored.user.role, email: stored.user.email });
  } catch (err) {
    clearChallengeCookie();
    return handleError(err);
  }
}
