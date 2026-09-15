import 'server-only'
import type { Role } from '../types'

interface UserRecord {
  password: string
  role: Role
}

function getUsers(): Record<string, UserRecord> {
  return {
    student: {
      password: process.env.AUTH_STUDENT_PASSWORD ?? '',
      role: 'student',
    },
    editor: {
      password: process.env.AUTH_EDITOR_PASSWORD ?? '',
      role: 'editor',
    },
  }
}

export function verifyCredentials(
  login: string,
  password: string,
): Role | null {
  const user = getUsers()[login]

  if (!user || !user.password || user.password !== password) {
    return null
  }

  return user.role
}
