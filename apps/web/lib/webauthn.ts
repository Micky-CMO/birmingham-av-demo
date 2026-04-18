import { cookies } from 'next/headers';

/**
 * WebAuthn helper: resolves the Relying Party (RP) ID and origin at request time
 * from the NEXT_PUBLIC_APP_URL env var, and provides a small cookie-based challenge
 * store so we don't need a server-side session table.
 *
 * The RP ID is the effective domain (hostname only, no scheme/port). The origin is
 * the full URL (scheme + host [+ port]). Both must match what the browser sends,
 * otherwise @simplewebauthn/server will refuse the attestation.
 *
 * Challenges are short-lived, single-use random nonces. We store them in an
 * HttpOnly, Secure, SameSite=Strict cookie to avoid needing a DB table or
 * in-memory store (which wouldn't survive serverless cold starts). 5-minute TTL.
 */

export const RP_NAME = 'Birmingham AV';
export const CHALLENGE_COOKIE = 'bav_webauthn_challenge';
const CHALLENGE_MAX_AGE = 60 * 5; // 5 minutes

export type ChallengeType = 'registration' | 'authentication';

export type ChallengePayload = {
  challenge: string;
  type: ChallengeType;
  userId?: string;
};

/** Extract the app URL from env with a dev fallback. */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/** Parse the app URL into `{ origin, rpID }` suitable for @simplewebauthn/server. */
export function getRpInfo(): { origin: string; rpID: string } {
  const raw = getAppUrl();
  try {
    const url = new URL(raw);
    // Origin drops trailing slash, includes scheme + host [+ port]
    const origin = `${url.protocol}//${url.host}`;
    // RP ID is just the hostname (no port, no scheme)
    return { origin, rpID: url.hostname };
  } catch {
    return { origin: 'http://localhost:3000', rpID: 'localhost' };
  }
}

/** Persist a registration or authentication challenge in an HttpOnly cookie. */
export function setChallengeCookie(payload: ChallengePayload): void {
  const store = cookies();
  store.set(CHALLENGE_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHALLENGE_MAX_AGE,
  });
}

/** Read and return the challenge payload, or null if missing / malformed. */
export function readChallengeCookie(): ChallengePayload | null {
  const store = cookies();
  const raw = store.get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ChallengePayload;
    if (typeof parsed?.challenge !== 'string' || typeof parsed?.type !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Delete the challenge cookie. Safe to call even if it's not set. */
export function clearChallengeCookie(): void {
  const store = cookies();
  store.set(CHALLENGE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/** Roles considered "staff-ish" for the bav_staff flag. */
export const STAFF_ROLES = new Set(['support_staff', 'admin', 'super_admin', 'builder']);
