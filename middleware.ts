import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_IPS = (process.env.ALLOWED_IPS || '').split(',').map(s => s.trim()).filter(Boolean)

export function middleware(request: NextRequest) {
  if (ALLOWED_IPS.length === 0) return NextResponse.next()

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') ?? '127.0.0.1')

  if (!ALLOWED_IPS.includes(ip)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
