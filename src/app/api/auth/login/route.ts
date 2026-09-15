import { NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth/users'
import { createSessionCookie } from '@/lib/auth/session'

export async function POST(request: Request) {
  const { login, password } = await request.json()

  const role = verifyCredentials(login, password)

  if (!role) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  await createSessionCookie(role)

  return NextResponse.json({ success: true, role })
}
