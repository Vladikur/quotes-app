'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { uploadQuotesApi } from '@/lib/api-client'
import type { QuoteInput } from '@/lib/types'

const REQUIRED_FIELDS = [
  'author_en',
  'author_ru',
  'text_en',
  'text_ru',
] as const

function validateQuotes(
  data: unknown,
  t: (
    key: 'errors.jsonArrayExpected' | 'errors.requiredFieldInvalid',
  ) => string,
): asserts data is QuoteInput[] {
  if (!Array.isArray(data)) {
    throw new Error(t('errors.jsonArrayExpected'))
  }

  data.forEach((item) => {
    const record = item as Record<string, unknown>

    REQUIRED_FIELDS.forEach((field) => {
      if (!record[field] || typeof record[field] !== 'string') {
        throw new Error(`"${field}" ${t('errors.requiredFieldInvalid')}`)
      }
    })
  })
}

export function BulkUploadForm() {
  const { t } = useI18n()
  const [rawInput, setRawInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function onUpload() {
    setLoading(true)

    try {
      let parsed: unknown

      try {
        parsed = JSON.parse(rawInput)
      } catch {
        throw new Error(t('errors.invalidJson'))
      }

      validateQuotes(parsed, t)

      const res = await uploadQuotesApi(parsed)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-center text-2xl font-medium">
        {t('bulkUpload.title')}
      </h1>

      <Button variant="outline" size="sm" className="mt-6" asChild>
        <Link href="/">{t('notFound.goHome')}</Link>
      </Button>

      <p className="mt-4 text-sm text-muted-foreground">
        {t('bulkUpload.hint')}
      </p>

      <Textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder={`[\n  {\n    "author_en": "...",\n    "author_ru": "...",\n    "text_en": "...",\n    "text_ru": "..."\n  }\n]`}
        rows={16}
        className="mt-3 font-mono text-sm"
      />

      <div className="mt-4 flex justify-end">
        <Button onClick={onUpload} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('bulkUpload.upload')}
        </Button>
      </div>
    </div>
  )
}
