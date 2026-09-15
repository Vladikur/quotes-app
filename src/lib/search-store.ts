import 'server-only'
import { randomUUID } from 'node:crypto'
import type { ScoredQuote } from './types'

const TTL = 1000 * 60 * 10 // 10 минут

interface SearchEntry {
  createdAt: number
  data: ScoredQuote[]
}

const globalForSearchStore = globalThis as unknown as {
  searchStore?: Map<string, SearchEntry>
}

const store = globalForSearchStore.searchStore ?? new Map<string, SearchEntry>()

if (process.env.NODE_ENV !== 'production') {
  globalForSearchStore.searchStore = store
}

export function createSearch(data: ScoredQuote[]): string {
  const id = randomUUID()

  store.set(id, {
    createdAt: Date.now(),
    data,
  })

  return id
}

export function getSearch(id: string): ScoredQuote[] | null {
  const entry = store.get(id)
  if (!entry) return null

  if (Date.now() - entry.createdAt > TTL) {
    store.delete(id)
    return null
  }

  return entry.data
}
