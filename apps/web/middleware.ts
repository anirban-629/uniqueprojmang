import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static files, API routes, and public assets pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/' ||
    pathname.startsWith('/login')
  ) {
    const response = NextResponse.next();
    response.headers.set('x-flowline-edge-region', 'fra1');
    response.headers.set('x-ratelimit-limit', '10000');
    response.headers.set('x-ratelimit-remaining', '9998');
    return response;
  }

  // Simulated Edge Auth Session check
  const sessionCookie = request.cookies.get('flowline_session');
  
  // For demo/dev ease: if no cookie is present, create a default mock authenticated session header
  // so the user seamlessly enters the authenticated shell without login roadblock
  const response = NextResponse.next();
  response.headers.set('x-flowline-user-id', sessionCookie?.value || 'usr-1');
  response.headers.set('x-flowline-role', 'tech_lead');
  response.headers.set('x-ratelimit-limit', '10000');
  response.headers.set('x-ratelimit-remaining', '9998');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
