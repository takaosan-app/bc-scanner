import { NextRequest, NextResponse } from 'next/server'

const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || ''
const AUTH_COOKIE = 'bc_auth'

export function middleware(request: NextRequest) {
  if (!ACCESS_PASSWORD) return NextResponse.next()

  const { pathname, basePath } = request.nextUrl

  // ログイン関連は通す（basePath あり・なし両対応）
  const stripped = basePath ? pathname.replace(basePath, '') || '/' : pathname
  if (stripped === '/login' || stripped.startsWith('/api/login')) {
    return NextResponse.next()
  }

  // 認証Cookie確認
  if (request.cookies.get(AUTH_COOKIE)?.value === ACCESS_PASSWORD) {
    return NextResponse.next()
  }

  // ログインページへリダイレクト
  const url = request.nextUrl.clone()
  url.pathname = basePath + '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
