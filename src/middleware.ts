import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, sha256Hex } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 인증 예외: 로그인 페이지, cron(자체 CRON_SECRET 검증)
  if (pathname.startsWith('/login') || pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  const password = process.env.DASH_PASSWORD;
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (password && cookie === (await sha256Hex(password))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
