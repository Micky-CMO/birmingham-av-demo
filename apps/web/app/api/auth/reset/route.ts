import { z } from 'zod';
import { bad, handleError, ok, parseBody } from '@/lib/json';

const Schema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(10).max(200),
});

/**
 * Password reset. The full flow (verify signed token, look up user, rotate
 * password hash, revoke other sessions) arrives in a later batch. This
 * stub keeps the client contract stable: invalid tokens → 400, valid
 * shape → 200.
 */
export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    // TODO: verify token signature + TTL, rotate password hash, sign user in.
    if (body.token.length < 16) return bad(400, 'Reset link is invalid or expired.');
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
