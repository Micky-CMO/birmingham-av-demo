import { handleError, ok, bad } from '@/lib/json';

/**
 * NextAuth route. Using a stub here while the full provider config is finalised
 * (credentials + Google OAuth + Prisma adapter). Endpoint is callable so callers
 * don't 404; returns a clear "not configured" error until keys land.
 */
export async function GET() {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      return bad(503, 'Auth not configured', { hint: 'Set NEXTAUTH_SECRET and GOOGLE_CLIENT_ID/SECRET in .env.local.' });
    }
    return ok({ providers: ['credentials', 'google'], note: 'Stub until provider wiring is finalised' });
  } catch (err) {
    return handleError(err);
  }
}
export const POST = GET;
