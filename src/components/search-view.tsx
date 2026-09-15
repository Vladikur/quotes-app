'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Info,
  Loader2,
  Search as SearchIcon,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QuoteCard } from '@/components/quote-card'
import { QuotePagination } from '@/components/quote-pagination'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/contexts/auth-context'
import {
  fetchQuotes,
  fetchDuplicateQuotes,
  deleteQuoteApi,
} from '@/lib/api-client'
import type { ScoredQuote } from '@/lib/types'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const PAGE_SIZE = 20

interface QueryState {
  search: string
  strict: boolean
  page: number
}

function readQueryState(params: URLSearchParams): QueryState {
  const pageParam = Number(params.get('page'))

  return {
    search: params.get('q') ?? '',
    strict: params.get('strict') === '1',
    page: pageParam > 0 ? pageParam : 1,
  }
}

export function SearchView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const { role } = useAuth()

  const isDevMode = searchParams.get('dev-mode') === 'true'

  const [searchInput, setSearchInput] = useState('')
  const [isStrictSearch, setIsStrictSearch] = useState(false)
  const [page, setPage] = useState(1)
  const [quotes, setQuotes] = useState<ScoredQuote[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [lang, setLang] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [isHintOpen, setIsHintOpen] = useState(false)

  const searchIdRef = useRef<string | null>(null)
  const isSyncingUrlRef = useRef(false)
  const initializedRef = useRef(false)

  const loadQuotes = useCallback(
    async (query: QueryState) => {
      setLoading(true)

      try {
        const res = await fetchQuotes({
          search: query.search || null,
          strict: query.strict,
          page: query.page,
          limit: PAGE_SIZE,
          searchId: searchIdRef.current,
        })

        if (!res.success) throw new Error()

        setQuotes(res.data)
        setTotalCount(res.count)
        setLang(res.lang)
        if (res.searchId) searchIdRef.current = res.searchId
      } catch {
        toast.error(t('errors.loadQuotesFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  // Реагируем на изменение URL: прямой заход, back/forward
  useEffect(() => {
    if (isSyncingUrlRef.current) {
      isSyncingUrlRef.current = false
      return
    }

    const next = readQueryState(searchParams)
    const filtersChanged =
      !initializedRef.current ||
      next.search !== searchInput ||
      next.strict !== isStrictSearch

    if (filtersChanged) searchIdRef.current = null

    setSearchInput(next.search)
    setIsStrictSearch(next.strict)
    setPage(next.page)
    initializedRef.current = true

    loadQuotes(next)
    window.scrollTo({ top: 0, behavior: filtersChanged ? 'auto' : 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function syncUrl(next: QueryState) {
    isSyncingUrlRef.current = true

    const params = new URLSearchParams()
    if (next.search) params.set('q', next.search)
    if (next.strict) params.set('strict', '1')
    if (next.page > 1) params.set('page', String(next.page))

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  async function onClear() {
    searchIdRef.current = null
    setSearchInput('')
    await loadQuotes({ search: '', strict: isStrictSearch, page: 1 })
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    syncUrl({ search: '', strict: isStrictSearch, page: 1 })
  }

  async function onSearch() {
    searchIdRef.current = null
    const term = searchInput.trim()

    if (term && typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'search', search_term: searchInput })
    }

    await loadQuotes({ search: searchInput, strict: isStrictSearch, page: 1 })
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    syncUrl({ search: searchInput, strict: isStrictSearch, page: 1 })
  }

  async function onStrictChange(checked: boolean) {
    setIsStrictSearch(checked)
    searchIdRef.current = null
    await loadQuotes({ search: searchInput, strict: checked, page: 1 })
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    syncUrl({ search: searchInput, strict: checked, page: 1 })
  }

  async function onPageChange(newPage: number) {
    setPage(newPage)
    await loadQuotes({
      search: searchInput,
      strict: isStrictSearch,
      page: newPage,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    syncUrl({ search: searchInput, strict: isStrictSearch, page: newPage })
  }

  async function loadDuplicates() {
    setLoading(true)

    try {
      const res = await fetchDuplicateQuotes()
      if (!res.success) throw new Error()

      searchIdRef.current = null
      setQuotes(res.data)
      setTotalCount(res.count)
    } catch {
      toast.error(t('errors.loadQuotesFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function onDeleteQuote(id: number) {
    if (deletingIds.has(id)) return

    setDeletingIds((prev) => new Set(prev).add(id))

    try {
      const res = await deleteQuoteApi(id)
      if (!res.success) throw new Error()

      setQuotes((prev) => prev.filter((q) => q.id !== id))
      setTotalCount((prev) => Math.max(0, prev - 1))
      toast.success(t('success.deleteQuoteSuccess'))
    } catch {
      toast.error(t('errors.deleteQuoteFailed'))
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const showFirstLoadSkeleton = loading && quotes.length === 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-center text-2xl font-medium">
        {t('searchQuotes.title')}
      </h1>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={t('searchQuotes.placeholder')}
            className="h-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClear}
              aria-label={t('searchQuotes.clearSearch')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          size="lg"
          onClick={onSearch}
          disabled={loading}
          aria-label={t('searchQuotes.title')}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4" />
          )}
        </Button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <Checkbox
          checked={isStrictSearch}
          onCheckedChange={(v) => onStrictChange(v === true)}
        />
        {t('searchQuotes.strictSearch')}
      </label>

      {(role === 'editor' || isDevMode) && (
        <p className="mt-4 w-fit rounded-md border border-primary/40 px-2 py-1 text-xs text-primary">
          lang: {lang ?? '—'}, page: {page}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {t('searchQuotes.total')} {totalCount}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsHintOpen(true)}
              aria-label={t('searchQuotes.hintTitle')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('searchQuotes.hintTitle')}</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={isHintOpen} onOpenChange={setIsHintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('searchQuotes.hintTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>{t('searchQuotes.hintText1')}</p>
            <p>{t('searchQuotes.hintText2')}</p>
            <p>{t('searchQuotes.hintText3')}</p>
            <p>{t('searchQuotes.hintText4')}</p>
          </div>
        </DialogContent>
      </Dialog>

      {role === 'editor' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="secondary" size="sm" onClick={loadDuplicates}>
            <Sparkles className="size-3.5" />
            {t('searchQuotes.showDuplicates')}
          </Button>

          <Button variant="secondary" size="sm" asChild>
            <Link href="/bulk">
              <Upload className="size-3.5" />
              {t('searchQuotes.uploadQuotes')}
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-6" aria-busy={loading}>
        {showFirstLoadSkeleton ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : quotes.length ? (
          <div
            className={
              loading ? 'opacity-60 transition-opacity' : 'transition-opacity'
            }
          >
            <div className="space-y-6">
              {quotes.map((q) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  isDevMode={isDevMode}
                  isDeleting={deletingIds.has(q.id)}
                  onDelete={onDeleteQuote}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('searchQuotes.empty')}
          </p>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
          <QuotePagination
            page={page}
            itemCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
