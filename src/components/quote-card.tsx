'use client'

import Link from 'next/link'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/contexts/auth-context'
import type { ScoredQuote } from '@/lib/types'
import { cn } from '@/lib/utils'

function normalizeForDisplay(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\/n/g, '\n') // исправляем ошибочный /n
    .replace(/\r\n|\r|\n/g, '\n') // нормализуем переносы
}

export function QuoteCard({
  quote,
  isDevMode,
  isDeleting,
  onDelete,
}: {
  quote: ScoredQuote
  isDevMode: boolean
  isDeleting: boolean
  onDelete: (id: number) => void
}) {
  const { t } = useI18n()
  const { role } = useAuth()

  const showDevInfo = role === 'editor' || isDevMode

  return (
    <Card
      className={cn(
        'gap-4 p-5 transition-opacity sm:p-6',
        isDeleting && 'pointer-events-none opacity-30',
      )}
    >
      {showDevInfo && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-muted-foreground">
              id: {quote.id}
            </Badge>
            {typeof quote.score === 'number' && (
              <Badge variant="outline" className="text-muted-foreground">
                score: {quote.score.toFixed(3)}
              </Badge>
            )}
          </div>

          {role === 'editor' && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon-sm" asChild>
                <Link
                  href={`/edit/${quote.id}`}
                  aria-label={t('editQuote.title')}
                >
                  <Pencil className="size-3.5" />
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('confirm.deleteQuote')}
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => onDelete(quote.id)}
                    >
                      {t('actions.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      )}

      <QuoteBlock
        author={quote.author_en}
        source={quote.source_en}
        text={quote.text_en}
        comment={quote.robert_comment_en}
        commentLabel="Robert's comment:"
      />

      <Separator />

      <QuoteBlock
        author={quote.author_ru}
        source={quote.source_ru}
        text={quote.text_ru}
        comment={quote.robert_comment_ru}
        commentLabel="Комментарий Роберта:"
      />
    </Card>
  )
}

function QuoteBlock({
  author,
  source,
  text,
  comment,
  commentLabel,
}: {
  author: string
  source: string | null
  text: string
  comment: string | null
  commentLabel: string
}) {
  const { t } = useI18n()

  const handleCopy = async () => {
    const normalizedText = normalizeForDisplay(text)

    try {
      await navigator.clipboard.writeText(`${normalizedText}\n— ${author}`)
      toast.success(t('success.quoteCopied'))
    } catch {
      toast.error(t('errors.unknown'))
    }
  }

  return (
    <div className="relative space-y-2">
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-0 right-0 shrink-0 text-muted-foreground"
        aria-label={t('actions.copyQuote')}
        onClick={handleCopy}
      >
        <Copy className="size-3.5" />
      </Button>

      <div className="pr-9">
        <h4 className="font-medium">{author}</h4>
        {source && <p className="text-sm text-muted-foreground">{source}</p>}
      </div>

      <p className="text-base whitespace-pre-line sm:text-lg">
        {normalizeForDisplay(text)}
      </p>

      {comment && (
        <p className="text-sm text-muted-foreground italic">
          {commentLabel} {normalizeForDisplay(comment)}
        </p>
      )}
    </div>
  )
}
