import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internals, static assets, and api pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for presence of auth token/cookie
  const hasSession = 
    request.cookies.has('flowline_session') ||
    request.cookies.has('access_token') ||
    request.cookies.has('session');

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email');

  const isLandingRoute = pathname === '/';

  // If unauthenticated and accessing protected app area -> redirect to /login
  if (!hasSession && !isAuthRoute && !isLandingRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated and accessing login/register -> redirect to main app (or dashboard)
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/board', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-flowline-edge-region', 'fra1');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
