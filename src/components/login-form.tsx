'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/contexts/auth-context'

export function LoginForm() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()

  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!loginValue || !password) {
      toast.warning(t('errors.fillAllFields'))
      return
    }

    setLoading(true)

    try {
      const ok = await login(loginValue, password)
      if (!ok) throw new Error()

      toast.success(t('success.loginSuccess'))
      router.push('/')
      router.refresh()
    } catch {
      toast.error(t('errors.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md justify-center px-4 py-20 sm:px-6">
      <Card className="w-full p-6">
        <h2 className="mb-6 text-center text-xl font-medium">
          {t('login.title')}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder={t('login.loginPlaceholder')}
            autoComplete="username"
            className="h-10"
          />

          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t('login.submit')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
