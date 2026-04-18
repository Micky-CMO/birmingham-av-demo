import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';

const Schema = z.object({
  identifier: z.string().min(2).max(120),
  password: z.string().min(1).max(200),
});

// Hard-coded demo admin (first line of defence — works even before DB admins exist).
const DEMO_ADMIN = {
  identifier: 'Hamza2026',
  password: 'Micky2026!',
  email: 'hamza2026@birmingham-av.com',
  role: 'super_admin',
  displayName: 'Hamza',
};

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);

    let authed: { userId: string; email: string; role: string } | null = null;

    // 1. Demo admin match
    if (body.identifier === DEMO_ADMIN.identifier && body.password === DEMO_ADMIN.password) {
      // Ensure a row exists for this admin so admin pages referencing userId keep working
      const user = await prisma.user.upsert({
        where: { email: DEMO_ADMIN.email },
        update: { role: 'super_admin' as const },
        create: {
          email: DEMO_ADMIN.email,
          passwordHash: await bcrypt.hash(DEMO_ADMIN.password, 10),
          role: 'super_admin' as const,
          firstName: DEMO_ADMIN.displayName,
          emailVerifiedAt: new Date(),
        },
      });
      authed = { userId: user.userId, email: user.email, role: user.role };
    }

    // 2. Real DB user via email or username-looking email
    if (!authed) {
      const guessEmails = [
        body.identifier,
        `${body.identifier}@birmingham-av.com`,
        `${body.identifier.toLowerCase()}@birmingham-av.com`,
      ];
      const user = await prisma.user.findFirst({
        where: { email: { in: guessEmails } },
      });
      if (user?.passwordHash) {
        const looksBcrypt = user.passwordHash.startsWith('$2');
        const ok = looksBcrypt
          ? await bcrypt.compare(body.password, user.passwordHash)
          : // sha256 fallback for users seeded before bcrypt wiring
            user.passwordHash === require('node:crypto').createHash('sha256').update(body.password).digest('hex');
        if (ok) {
          authed = { userId: user.userId, email: user.email, role: user.role };
          await prisma.user.update({ where: { userId: user.userId }, data: { lastLoginAt: new Date() } });
        }
      }
    }

    if (!authed) return bad(401, 'Invalid username or password');

    // Issue cookies: session token + staff flag (the admin middleware checks bav_staff)
    const store = cookies();
    store.set('bav_session', `user:${authed.userId}`, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14,
    });
    if (['support_staff', 'admin', 'super_admin', 'builder'].includes(authed.role)) {
      store.set('bav_staff', '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 14,
      });
    }

    return ok({ ok: true, role: authed.role, email: authed.email });
  } catch (err) {
    return handleError(err);
  }
}
