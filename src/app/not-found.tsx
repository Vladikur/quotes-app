'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-medium">{t('notFound.title')}</h1>
      <Button asChild>
        <Link href="/">{t('notFound.goHome')}</Link>
      </Button>
    </div>
  )
}
