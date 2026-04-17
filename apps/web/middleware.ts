import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin gate.
 *
 * Production: NextAuth JWT check (TODO, wire once auth is finalised).
 * Demo: set BAV_DEMO_MODE=true to bypass the gate. This is safe for a client
 * walkthrough because no real customer data lives in the demo DB.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  if (process.env.BAV_DEMO_MODE === 'true') {
    const res = NextResponse.next();
    res.cookies.set('bav_staff', '1', { httpOnly: true, sameSite: 'lax', path: '/' });
    return res;
  }

  const staff = request.cookies.get('bav_staff')?.value;
  if (!staff) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
