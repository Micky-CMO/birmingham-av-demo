import { cookies } from 'next/headers';
import crypto from 'node:crypto';

/**
 * Stub session helpers. Real auth is NextAuth (see app/api/auth/[...nextauth]/route.ts
 * once Google OAuth + credentials providers are finalised).
 *
 * For now this issues an anonymous session cookie so cart persistence works in dev.
 */

export function anonSessionToken(): string {
  const store = cookies();
  const existing = store.get('bav_session');
  if (existing?.value) return existing.value;
  const token = crypto.randomBytes(24).toString('base64url');
  store.set('bav_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function getCurrentUser(): Promise<{ userId: string; role: string } | null> {
  // TODO: wire NextAuth server session here.
  return null;
}

export async function requireStaff() {
  const u = await getCurrentUser();
  if (!u || !['support_staff', 'admin', 'super_admin'].includes(u.role)) {
    throw new Response(JSON.stringify({ error: { message: 'forbidden' } }), { status: 403 });
  }
  return u;
}
