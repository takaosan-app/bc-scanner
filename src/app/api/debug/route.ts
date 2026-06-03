import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasPassword: !!process.env.ACCESS_PASSWORD,
    passwordLength: process.env.ACCESS_PASSWORD?.length ?? 0,
    hasCookie: request.cookies.has('bc_auth'),
    middlewareHeader: request.headers.get('x-middleware-ran') ?? 'not set',
  })
}
