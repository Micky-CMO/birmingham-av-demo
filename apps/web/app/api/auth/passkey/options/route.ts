import { z } from 'zod';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';
import { getRpInfo, setChallengeCookie } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint: issue a PublicKeyCredentialRequestOptions blob the browser
 * can pass to `startAuthentication()`.
 *
 * If the caller supplies an email we look up that user's credentials and put
 * them into `allowCredentials` so the authenticator knows which keys are valid.
 * Otherwise we issue a "usernameless" challenge — the browser will let the user
 * pick any discoverable credential (passkey) they have stored.
 *
 * We never leak whether an email exists: on miss we simply fall back to the
 * usernameless flow so the request still succeeds.
 */
const Schema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const { rpID } = getRpInfo();

    let allowCredentials: { id: string; transports?: string[] }[] = [];
    let lookedUpUserId: string | undefined;

    if (body.email) {
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        select: {
          userId: true,
          webauthnCredentials: {
            select: { credentialId: true, transports: true },
          },
        },
      });
      if (user) {
        lookedUpUserId = user.userId;
        allowCredentials = user.webauthnCredentials.map((c) => ({
          id: c.credentialId,
          transports: c.transports,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      // Cast transports to the simplewebauthn-expected union. Any unknown values
      // from the DB are filtered out by the authenticator regardless.
      allowCredentials: allowCredentials.map((c) => ({
        id: c.id,
        transports: (c.transports?.length ? c.transports : undefined) as
          | ('internal' | 'hybrid' | 'usb' | 'nfc' | 'ble' | 'cable' | 'smart-card')[]
          | undefined,
      })),
    });

    setChallengeCookie({
      challenge: options.challenge,
      type: 'authentication',
      userId: lookedUpUserId,
    });

    return ok({ options });
  } catch (err) {
    return handleError(err);
  }
}
