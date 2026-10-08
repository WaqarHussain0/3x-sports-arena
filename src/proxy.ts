import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

// Next 16 renamed `middleware.ts` to `proxy.ts` (plan §7).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  if (pathname.startsWith('/api')) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { success: false, error: { message: 'You must be signed in.', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
