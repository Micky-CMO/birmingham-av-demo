import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

/**
 * Stub session helpers. Real auth is NextAuth (see app/api/auth/[...nextauth]/route.ts
 * once Google OAuth + credentials providers are finalised).
 *
 * For now this issues an anonymous session cookie so cart persistence works in dev,
 * and reads the `bav_session` cookie set by the /api/auth/signin route.
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

/**
 * Read the session cookie and, if it identifies a user, return their userId + role.
 * Returns null for anonymous visitors.
 */
export async function getCurrentUser(): Promise<{ userId: string; role: string } | null> {
  const store = cookies();
  const session = store.get('bav_session')?.value;
  if (!session || !session.startsWith('user:')) return null;
  const userId = session.slice(5);
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, role: true, deletedAt: true },
  }).catch(() => null);
  if (!user || user.deletedAt) return null;
  return { userId: user.userId, role: user.role };
}

/**
 * Return the current staff user. If no user is signed in but demo mode is active,
 * fall back to the seeded super-admin so the admin console is fully usable in demos.
 * Throws a Response(403) otherwise.
 */
export async function requireStaff(): Promise<{ userId: string; role: string }> {
  const direct = await getCurrentUser();
  if (direct && ['support_staff', 'admin', 'super_admin'].includes(direct.role)) return direct;

  if (process.env.BAV_DEMO_MODE === 'true') {
    const demo = await prisma.user.findFirst({
      where: { role: 'super_admin', deletedAt: null },
      select: { userId: true, role: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => null);
    if (demo) return { userId: demo.userId, role: demo.role };
  }

  throw new Response(JSON.stringify({ error: { message: 'forbidden' } }), { status: 403 });
}
