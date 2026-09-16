'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { structureQuotesApi, uploadQuotesApi } from '@/lib/api-client'
import type { QuoteInput } from '@/lib/types'

export function BulkUploadForm() {
  const { t } = useI18n()
  const [rawText, setRawText] = useState('')
  const [structured, setStructured] = useState<QuoteInput[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setLoading(true)
    setStructured(null)

    try {
      const structureRes = await structureQuotesApi(rawText)

      if (!structureRes.success || !structureRes.data) {
        toast.error(structureRes.message ?? t('errors.unknown'))
        return
      }

      setStructured(structureRes.data)

      const uploadRes = await uploadQuotesApi(structureRes.data)
      if (uploadRes.success) toast.success(uploadRes.message)
      else toast.error(uploadRes.message)
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
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={t('bulkUpload.placeholder')}
        rows={16}
        className="mt-3 text-sm"
      />

      <div className="mt-4 flex justify-end">
        <Button onClick={onSubmit} disabled={loading || !rawText.trim()}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('bulkUpload.upload')}
        </Button>
      </div>

      {structured && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {t('bulkUpload.previewTitle')}
          </p>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-muted p-3 text-xs">
            {JSON.stringify(structured, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
