import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasPassword: !!process.env.ACCESS_PASSWORD,
    passwordLength: process.env.ACCESS_PASSWORD?.length ?? 0,
  })
}
