import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE = 'bc_auth'

export function middleware(request: NextRequest) {
  const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || ''

  if (!ACCESS_PASSWORD) return NextResponse.next()

  const { pathname } = request.nextUrl

  // ログイン関連は通す（/bc/login と /login の両方に対応）
  if (pathname.endsWith('/login') || pathname.includes('/api/login')) {
    return NextResponse.next()
  }

  // 認証Cookie確認
  if (request.cookies.get(AUTH_COOKIE)?.value === ACCESS_PASSWORD) {
    return NextResponse.next()
  }

  // ログインページへリダイレクト
  return NextResponse.redirect(new URL('/bc/login', request.url))
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
