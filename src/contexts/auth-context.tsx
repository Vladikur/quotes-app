'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'

interface AuthContextValue {
  role: Role | null
  login: (login: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  initialRole,
  children,
}: {
  initialRole: Role | null
  children: React.ReactNode
}) {
  const [role, setRole] = useState<Role | null>(initialRole)
  const router = useRouter()

  const login = useCallback(async (loginValue: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginValue, password }),
    })

    const data = await res.json()
    if (!data.success) return false

    setRole(data.role)
    return true
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setRole(null)
    router.push('/')
    router.refresh()
  }, [router])

  const value = useMemo(() => ({ role, login, logout }), [role, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
