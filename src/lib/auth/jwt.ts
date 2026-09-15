import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { Role } from '../types'

export interface SessionPayload extends JWTPayload {
  role: Role
}

function getSecretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(getSecretKey())
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    if (payload.role !== 'student' && payload.role !== 'editor') return null

    return { role: payload.role }
  } catch {
    return null
  }
}
