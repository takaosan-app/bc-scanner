import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE = 'bc_auth'

export function middleware(request: NextRequest) {
  const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || ''

  if (!ACCESS_PASSWORD) {
    const res = NextResponse.next()
    res.headers.set('x-middleware-ran', 'no-password')
    return res
  }

  const { pathname } = request.nextUrl

  if (pathname.endsWith('/login') || pathname.includes('/api/login')) {
    const res = NextResponse.next()
    res.headers.set('x-middleware-ran', 'login-bypass')
    return res
  }

  if (request.cookies.get(AUTH_COOKIE)?.value === ACCESS_PASSWORD) {
    const res = NextResponse.next()
    res.headers.set('x-middleware-ran', 'cookie-ok')
    return res
  }

  return NextResponse.redirect(new URL('/bc/login', request.url))
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
