'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { fetchQuoteById, updateQuoteApi } from '@/lib/api-client'

export function EditQuoteForm({ quoteId }: { quoteId: string }) {
  const { t } = useI18n()
  const router = useRouter()

  const [rawInput, setRawInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadQuote() {
      setLoading(true)

      try {
        const res = await fetchQuoteById(quoteId)
        if (!res.success) throw new Error()

        const {
          author_en,
          author_ru,
          text_en,
          text_ru,
          source_en,
          source_ru,
          robert_comment_en,
          robert_comment_ru,
        } = res.data

        setRawInput(
          JSON.stringify(
            {
              author_en,
              author_ru,
              text_en,
              text_ru,
              source_en,
              source_ru,
              robert_comment_en,
              robert_comment_ru,
            },
            null,
            2,
          ),
        )
      } catch {
        toast.error(t('errors.unknown'))
      } finally {
        setLoading(false)
      }
    }

    loadQuote()
  }, [quoteId, t])

  async function onUpdate() {
    let parsed

    try {
      parsed = JSON.parse(rawInput)
    } catch {
      toast.error(t('errors.invalidJson'))
      return
    }

    setLoading(true)

    try {
      const res = await updateQuoteApi(quoteId, parsed)

      if (res.success) toast.success(res.message)
      else toast.error(res.message)

      if (res.success) router.push('/?dev-mode=true&edit-mode=true')
    } catch {
      toast.error(t('errors.unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-center text-2xl font-medium">
        {t('editQuote.title')}
      </h1>

      <Button variant="outline" size="sm" className="mt-6" asChild>
        <Link href="/">{t('notFound.goHome')}</Link>
      </Button>

      <Textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="{ author_en: '...', author_ru: '...', text_en: '...', text_ru: '...' }"
        rows={16}
        className="mt-4 font-mono text-sm"
      />

      <div className="mt-4 flex justify-end">
        <Button onClick={onUpdate} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('editQuote.update')}
        </Button>
      </div>
    </div>
  )
}
