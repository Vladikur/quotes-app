'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/contexts/auth-context'

export function AppHeader() {
  const { t } = useI18n()
  const { role, logout } = useAuth()

  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5">
          <Image
            src="/gold-boat-minimized.png"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-medium tracking-tight">
            {t('header.appName')}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />

          <ThemeToggle />

          {role === 'editor' ? (
            <Button
              variant="outline"
              size="sm"
              aria-label={t('header.logOut')}
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              aria-label={t('header.logIn')}
              asChild
            >
              <Link href="/login">
                <LogIn className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
