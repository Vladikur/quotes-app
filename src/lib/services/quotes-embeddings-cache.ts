import 'server-only'
import { db } from '../db'
import { bufferToFloatArray } from '../utils/float-array-buffer'
import { normalizeSearchString } from '../utils/normalize-search-string'
import type { QuoteWithEmbeddings } from '../types'

interface Cache {
  quotes: QuoteWithEmbeddings[] | null
  loading: Promise<QuoteWithEmbeddings[]> | null
  /**
   * Растёт при каждом сбросе кэша. Производные кэши (например, индекс
   * дубликатов) хранят версию, на которой были построены, и пересчитываются
   * сами — так не нужно помнить про них на каждой мутации цитат.
   */
  version: number
}

const globalForCache = globalThis as unknown as {
  quotesEmbeddingsCache?: Cache
}

const cache: Cache = globalForCache.quotesEmbeddingsCache ?? {
  quotes: null,
  loading: null,
  version: 0,
}

// Объект мог пережить HMR от предыдущей версии модуля, где поля version ещё не
// было. Тогда version оказался бы NaN, а сравнение версий — всегда ложным, и
// производные кэши перестали бы срабатывать.
if (!Number.isFinite(cache.version)) cache.version = 0

if (process.env.NODE_ENV !== 'production') {
  globalForCache.quotesEmbeddingsCache = cache
}

export function resetQuotesEmbeddingsCache(): void {
  cache.quotes = null
  cache.loading = null
  cache.version++
}

export function getQuotesCacheVersion(): number {
  return cache.version
}

function loadQuotesWithEmbeddings() {
  return db
    .prepare(
      `
      SELECT
          id,
          author_en,
          author_ru,
          text_en,
          text_ru,
          source_en,
          source_ru,
          robert_comment_en,
          robert_comment_ru,
          created_at,
          embedding_en_blob,
          embedding_ru_blob
      FROM quotes
      WHERE embedding_en_blob IS NOT NULL
         OR embedding_ru_blob IS NOT NULL
      `,
    )
    .all() as Array<
    Omit<QuoteWithEmbeddings, 'embedding_en' | 'embedding_ru' | 'search_blob'>
  >
}

export async function getQuotesWithEmbeddings(): Promise<
  QuoteWithEmbeddings[]
> {
  // Уже загружено
  if (cache.quotes) {
    return cache.quotes
  }

  // Уже идёт загрузка
  if (cache.loading) {
    return cache.loading
  }

  cache.loading = Promise.resolve().then(() => {
    const rows = loadQuotesWithEmbeddings()

    cache.quotes = rows.map((q) => {
      const searchBlobRaw = [
        q.author_en,
        q.author_ru,
        q.text_en,
        q.text_ru,
        q.source_en,
        q.source_ru,
        q.robert_comment_en,
        q.robert_comment_ru,
      ]
        .filter(Boolean)
        .join(' ')

      return {
        ...q,
        embedding_en: q.embedding_en_blob
          ? bufferToFloatArray(q.embedding_en_blob)
          : null,
        embedding_ru: q.embedding_ru_blob
          ? bufferToFloatArray(q.embedding_ru_blob)
          : null,
        search_blob: normalizeSearchString(searchBlobRaw),
      }
    })

    cache.loading = null
    return cache.quotes
  })

  return cache.loading
}
