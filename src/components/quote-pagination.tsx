'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SLOT = 4

function getPageNumbers(page: number, pageCount: number): number[] {
  let start = Math.max(1, page - Math.floor(PAGE_SLOT / 2))
  const end = Math.min(pageCount, start + PAGE_SLOT - 1)
  start = Math.max(1, end - PAGE_SLOT + 1)

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function QuotePagination({
  page,
  itemCount,
  pageSize,
  onPageChange,
}: {
  page: number
  itemCount: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize))
  const pages = getPageNumbers(page, pageCount)

  return (
    <nav
      className="flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages[0] > 1 && (
        <>
          <PageButton page={1} active={false} onClick={onPageChange} />
          {pages[0] > 2 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
        </>
      )}

      {pages.map((p) => (
        <PageButton
          key={p}
          page={p}
          active={p === page}
          onClick={onPageChange}
        />
      ))}

      {pages[pages.length - 1] < pageCount && (
        <>
          {pages[pages.length - 1] < pageCount - 1 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
          <PageButton page={pageCount} active={false} onClick={onPageChange} />
        </>
      )}

      <Button
        variant="outline"
        size="icon-sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number
  active: boolean
  onClick: (page: number) => void
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="icon-sm"
      className={cn('tabular-nums', active && 'pointer-events-none')}
      onClick={() => onClick(page)}
      aria-current={active ? 'page' : undefined}
    >
      {page}
    </Button>
  )
}
