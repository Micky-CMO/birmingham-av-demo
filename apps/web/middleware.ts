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

  // Expose the pathname to Server Components via a request header. The admin
  // shell uses this to highlight the active nav tab without every page having
  // to pass its own prop.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  if (process.env.BAV_DEMO_MODE === 'true') {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
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
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/admin/:path*'],
};
