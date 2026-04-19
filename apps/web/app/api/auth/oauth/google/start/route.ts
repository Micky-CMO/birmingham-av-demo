import { NextResponse } from 'next/server';

// Stub — Google OAuth start. The real integration (PKCE + state cookie
// + redirect to Google's authorise endpoint) arrives in a later batch.
// Returning 501 keeps the UI intact: the button wiring compiles, but
// clicking it surfaces a clear "not yet implemented" response.
export function GET() {
  return NextResponse.json(
    { ok: false, error: { message: 'Google sign-in is not yet available.' } },
    { status: 501 },
  );
}

export function POST() {
  return NextResponse.json(
    { ok: false, error: { message: 'Google sign-in is not yet available.' } },
    { status: 501 },
  );
}
