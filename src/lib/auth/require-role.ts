import 'server-only'
import { NextResponse } from 'next/server'
import { getSession } from './session'
import type { Role } from '../types'
import type { SessionPayload } from './jwt'

export async function requireRole(
  role: Role,
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await getSession()

  if (!session) {
    return {
      response: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  if (session.role !== role) {
    return {
      response: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 },
      ),
    }
  }

  return { session }
}
