import { z } from 'zod';
import { ok, ValidationError, parseBody } from '@/lib/json';
import { NextResponse } from 'next/server';

const Schema = z.object({
  email: z.string().email(),
});

/**
 * Forgot-password entry. Always responds 200 to avoid leaking whether an
 * account exists on that email. Real email delivery + token issuance lives
 * in a later batch; this route parses + validates input and returns.
 */
export async function POST(request: Request) {
  try {
    await parseBody(request, Schema);
    // TODO: issue signed reset token + enqueue password-reset email.
    return ok({ ok: true });
  } catch (err) {
    // Mask outcome even on malformed input so attackers get no signal.
    if (err instanceof ValidationError) {
      return ok({ ok: true });
    }
    console.error('[api/auth/forgot]', err);
    return NextResponse.json({ ok: true });
  }
}
