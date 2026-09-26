'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// На телефоне кнопки крупнее, а ширины меньше — окно страниц там на одну уже,
// иначе ряд с трёхзначной последней страницей не влезает в 375px.
const PAGE_SLOT_MOBILE = 3
const PAGE_SLOT_DESKTOP = 4

const ITEM_CLASS = 'h-9 min-w-9 px-2 text-base sm:h-10 sm:min-w-10 sm:px-2.5'

function getPageNumbers(
  page: number,
  pageCount: number,
  slot: number,
): number[] {
  let start = Math.max(1, page - Math.floor(slot / 2))
  const end = Math.min(pageCount, start + slot - 1)
  start = Math.max(1, end - slot + 1)

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
  const props = { page, pageCount, onPageChange }

  return (
    <>
      <PaginationRow
        {...props}
        slot={PAGE_SLOT_MOBILE}
        className="flex sm:hidden"
      />
      <PaginationRow
        {...props}
        slot={PAGE_SLOT_DESKTOP}
        className="hidden sm:flex"
      />
    </>
  )
}

function PaginationRow({
  page,
  pageCount,
  slot,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  slot: number
  onPageChange: (page: number) => void
  className: string
}) {
  const pages = getPageNumbers(page, pageCount, slot)

  return (
    <nav
      className={cn('items-center justify-center gap-1 sm:gap-2', className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        className={ITEM_CLASS}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-5" />
      </Button>

      {pages[0] > 1 && (
        <>
          <PageButton page={1} active={false} onClick={onPageChange} />
          {pages[0] > 2 && <Ellipsis />}
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
          {pages[pages.length - 1] < pageCount - 1 && <Ellipsis />}
          <PageButton page={pageCount} active={false} onClick={onPageChange} />
        </>
      )}

      <Button
        variant="outline"
        className={ITEM_CLASS}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-5" />
      </Button>
    </nav>
  )
}

function Ellipsis() {
  return <span className="px-0.5 text-muted-foreground sm:px-1">…</span>
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
      className={cn(
        ITEM_CLASS,
        'tabular-nums',
        active && 'pointer-events-none',
      )}
      onClick={() => onClick(page)}
      aria-current={active ? 'page' : undefined}
    >
      {page}
    </Button>
  )
}
