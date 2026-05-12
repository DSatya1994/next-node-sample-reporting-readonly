import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/datetime', '/query'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isLoginPage = pathname === '/login';

  // Unauthenticated user tries to access a protected route → send to login
  if (!token && isProtected) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname); // preserve intended destination
    return NextResponse.redirect(url);
  }

  // Authenticated user hits the login page → send to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
