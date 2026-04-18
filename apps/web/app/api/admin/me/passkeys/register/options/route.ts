import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { RP_NAME, getRpInfo, setChallengeCookie } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

/**
 * Step 1 of passkey registration: issue a PublicKeyCredentialCreationOptions
 * blob for the browser. The client will call `startRegistration()` with this
 * and pass the result back to /register/verify.
 *
 * We exclude credentials the user has already enrolled to prevent the
 * authenticator from silently re-registering the same key.
 */
export async function POST() {
  try {
    const staff = await requireStaff();
    const user = await prisma.user.findUnique({
      where: { userId: staff.userId },
      select: { userId: true, email: true, firstName: true, lastName: true },
    });
    if (!user) return bad(404, 'user not found');

    const existing = await prisma.webauthnCredential.findMany({
      where: { userId: user.userId },
      select: { credentialId: true, transports: true },
    });

    const { rpID } = getRpInfo();

    // Prisma returns string[] for transports; narrow to the exact union simplewebauthn wants.
    const excludeCredentials = existing.map((c) => ({
      id: c.credentialId,
      transports: (c.transports.length ? c.transports : undefined) as
        | ('internal' | 'hybrid' | 'usb' | 'nfc' | 'ble' | 'cable' | 'smart-card')[]
        | undefined,
    }));

    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

    // `userID` must be a Uint8Array. Encode the UUID string as bytes.
    const userIdBytes = new TextEncoder().encode(user.userId);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: user.email,
      userID: userIdBytes,
      userDisplayName: displayName,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    setChallengeCookie({
      challenge: options.challenge,
      type: 'registration',
      userId: user.userId,
    });

    return ok({ options });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
