import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE = 'bc_auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || ''

  if (!ACCESS_PASSWORD || password !== ACCESS_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, ACCESS_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30日
    path: '/',
  })
  return response
}
