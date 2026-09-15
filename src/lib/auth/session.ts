import 'server-only'
import { cookies } from 'next/headers'
import { signSession, verifySession, type SessionPayload } from './jwt'
import type { Role } from '../types'

export const SESSION_COOKIE = 'session'

export async function createSessionCookie(role: Role): Promise<void> {
  const token = await signSession({ role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day, matches JWT expiry
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}
