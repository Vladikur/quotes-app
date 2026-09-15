import 'server-only'
import { db } from '../db'
import { embedString } from '../ai/embed-string'
import {
  buildEmbeddingsBatchRu,
  buildEmbeddingsBatchEn,
} from '../ai/build-embeddings-batch'
import { cosineSimilarity } from '../utils/cosine-similarity'
import { detectLanguage, type QuoteLang } from '../utils/detect-language'
import { normalizeSearchString } from '../utils/normalize-search-string'
import { floatArrayToBuffer } from '../utils/float-array-buffer'
import { formatSqliteDate } from '../utils/format-sqlite-date'
import { createSearch, getSearch } from '../search-store'
import {
  getQuotesWithEmbeddings,
  resetQuotesEmbeddingsCache,
} from './quotes-embeddings-cache'
import type { Quote, QuoteInput, ScoredQuote } from '../types'

const MIN_SCORE = 0.3

const QUOTE_COLUMNS = `
    id,
    author_en,
    author_ru,
    text_en,
    text_ru,
    source_en,
    source_ru,
    robert_comment_en,
    robert_comment_ru,
    created_at
`

export interface SearchQuotesInput {
  search?: string | null
  searchId?: string | null
  strict?: boolean
  page?: number
  limit?: number
}

export interface SearchQuotesResult {
  searchId?: string
  count: number
  page: number
  limit: number
  lang?: QuoteLang
  data: ScoredQuote[]
}

export async function searchQuotes({
  search,
  searchId,
  strict = false,
  page = 1,
  limit = 10,
}: SearchQuotesInput): Promise<SearchQuotesResult> {
  const pageNum = Math.max(Number(page), 1)
  const limitNum = Math.max(Number(limit), 1)
  const offset = (pageNum - 1) * limitNum

  // Пагинация по searchId
  if (searchId && !strict) {
    const data = getSearch(searchId)

    if (data) {
      return {
        searchId,
        count: data.length,
        page: pageNum,
        limit: limitNum,
        data: data.slice(offset, offset + limitNum),
      }
    }
  }

  // Обычный список (без поиска)
  if (!search) {
    const total = db.prepare(`SELECT COUNT(*) as count FROM quotes`).get() as {
      count: number
    }

    const quotes = db
      .prepare(
        `SELECT ${QUOTE_COLUMNS} FROM quotes ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(limitNum, offset) as Quote[]

    return {
      count: total.count,
      page: pageNum,
      limit: limitNum,
      data: quotes,
    }
  }

  // Строгий посимвольный поиск
  if (strict) {
    const normalizedQuery = normalizeSearchString(search)
    const quotes = await getQuotesWithEmbeddings()

    const matched = quotes.filter((q) =>
      q.search_blob.includes(normalizedQuery),
    )

    return {
      count: matched.length,
      page: pageNum,
      limit: limitNum,
      data: matched.slice(offset, offset + limitNum),
    }
  }

  // AI-поиск
  const lang = detectLanguage(search)
  const queryEmbedding = await embedString(search)
  const quotes = await getQuotesWithEmbeddings()

  const scored: ScoredQuote[] = quotes
    .map((q) => {
      const embedding = lang === 'ru' ? q.embedding_ru : q.embedding_en
      const score = embedding ? cosineSimilarity(queryEmbedding, embedding) : 0

      return {
        id: q.id,
        author_en: q.author_en,
        author_ru: q.author_ru,
        text_en: q.text_en,
        text_ru: q.text_ru,
        source_en: q.source_en,
        source_ru: q.source_ru,
        robert_comment_en: q.robert_comment_en,
        robert_comment_ru: q.robert_comment_ru,
        created_at: q.created_at,
        score,
      }
    })
    .filter((q) => q.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)

  const newSearchId = createSearch(scored)

  return {
    searchId: newSearchId,
    count: scored.length,
    page: pageNum,
    limit: limitNum,
    lang,
    data: scored.slice(offset, offset + limitNum),
  }
}

export function getQuoteById(id: number): Quote | undefined {
  return db
    .prepare(`SELECT ${QUOTE_COLUMNS} FROM quotes WHERE id = ? LIMIT 1`)
    .get(id) as Quote | undefined
}

export async function updateQuote(
  id: number,
  input: QuoteInput,
): Promise<boolean> {
  const exists = db.prepare('SELECT id FROM quotes WHERE id = ?').get(id)
  if (!exists) return false

  const {
    author_en,
    author_ru,
    text_en,
    text_ru,
    source_en = null,
    source_ru = null,
    robert_comment_en = null,
    robert_comment_ru = null,
  } = input

  const [embeddingRu, embeddingEn] = await Promise.all([
    buildEmbeddingsBatchRu([input]),
    buildEmbeddingsBatchEn([input]),
  ])

  db.prepare(
    `
    UPDATE quotes
    SET
        author_en = @author_en,
        author_ru = @author_ru,
        text_en = @text_en,
        text_ru = @text_ru,
        source_en = @source_en,
        source_ru = @source_ru,
        robert_comment_en = @robert_comment_en,
        robert_comment_ru = @robert_comment_ru,
        embedding_en_blob = @embedding_en_blob,
        embedding_ru_blob = @embedding_ru_blob
    WHERE id = @id
    `,
  ).run({
    id,
    author_en,
    author_ru,
    text_en,
    text_ru,
    source_en,
    source_ru,
    robert_comment_en,
    robert_comment_ru,
    embedding_en_blob: floatArrayToBuffer(embeddingEn[0]),
    embedding_ru_blob: floatArrayToBuffer(embeddingRu[0]),
  })

  resetQuotesEmbeddingsCache()

  return true
}

export function deleteQuote(id: number): boolean {
  const exists = db.prepare('SELECT id FROM quotes WHERE id = ?').get(id)
  if (!exists) return false

  db.prepare('DELETE FROM quotes WHERE id = ?').run(id)
  resetQuotesEmbeddingsCache()

  return true
}

export interface BulkInsertResult {
  addedCount: number
  skippedCount: number
}

export async function bulkInsertQuotes(
  quotes: QuoteInput[],
): Promise<BulkInsertResult> {
  const insertCandidates: Required<Omit<QuoteInput, never>>[] = []
  let skippedCount = 0

  const findByTextPrefixStmt = db.prepare(
    `SELECT id FROM quotes WHERE text_en LIKE ? LIMIT 1`,
  )

  for (const quote of quotes) {
    const {
      author_en,
      author_ru,
      text_en,
      text_ru,
      source_en = null,
      source_ru = null,
      robert_comment_en = null,
      robert_comment_ru = null,
    } = quote

    // Проверка дубликата по первым 5 словам
    const firstFiveWords = text_en.split(/\s+/).slice(0, 5).join(' ')

    const exists = findByTextPrefixStmt.get(`${firstFiveWords}%`)
    if (exists) {
      skippedCount++
      continue
    }

    insertCandidates.push({
      author_en,
      author_ru,
      text_en,
      text_ru,
      source_en,
      source_ru,
      robert_comment_en,
      robert_comment_ru,
    })
  }

  if (!insertCandidates.length) {
    return { addedCount: 0, skippedCount }
  }

  const [embeddingsRu, embeddingsEn] = await Promise.all([
    buildEmbeddingsBatchRu(insertCandidates),
    buildEmbeddingsBatchEn(insertCandidates),
  ])

  const insertStmt = db.prepare(
    `
    INSERT INTO quotes (
        author_en, author_ru, text_en, text_ru,
        source_en, source_ru, robert_comment_en, robert_comment_ru,
        embedding_en_blob, embedding_ru_blob, created_at
    ) VALUES (
        @author_en, @author_ru, @text_en, @text_ru,
        @source_en, @source_ru, @robert_comment_en, @robert_comment_ru,
        @embedding_en_blob, @embedding_ru_blob, @created_at
    )
    `,
  )

  let addedCount = 0

  const insertMany = db.transaction((rows: typeof insertCandidates) => {
    rows.forEach((row, index) => {
      insertStmt.run({
        ...row,
        embedding_en_blob: floatArrayToBuffer(embeddingsEn[index]),
        embedding_ru_blob: floatArrayToBuffer(embeddingsRu[index]),
        created_at: formatSqliteDate(),
      })
      addedCount++
    })
  })

  insertMany(insertCandidates)
  resetQuotesEmbeddingsCache()

  return { addedCount, skippedCount }
}
