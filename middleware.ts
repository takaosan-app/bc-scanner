import { NextRequest, NextResponse } from 'next/server'

const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || ''
const AUTH_COOKIE = 'bc_auth'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // パスワード未設定なら制限なし
  if (!ACCESS_PASSWORD) return NextResponse.next()

  // ログイン関連は通す
  if (path.startsWith('/bc/login') || path.startsWith('/bc/api/login')) {
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
