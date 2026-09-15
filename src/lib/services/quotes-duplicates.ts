import 'server-only'
import { db } from '../db'
import { normalizeSearchString } from '../utils/normalize-search-string'
import { getQuotesCacheVersion } from './quotes-embeddings-cache'
import type { Quote } from '../types'

/**
 * Доля общих триграмм (коэффициент Жаккара), при которой две цитаты считаются
 * возможными дубликатами. 0.65 отобрано по текущей базе: выше — теряются
 * дубликаты с дописанной строкой или префиксом, ниже — начинают попадать просто
 * похожие по лексике цитаты.
 */
const DUPLICATE_SIMILARITY_THRESHOLD = 0.65

/** Тексты короче этого (после нормализации) не сравниваем: триграмм слишком мало. */
const MIN_NORMALIZED_LENGTH = 8

/** Как долго можно занимать event loop, прежде чем уступить его другим запросам. */
const YIELD_INTERVAL_MS = 10

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

interface DuplicatesCache {
  /** Версия данных цитат, для которой посчитан result (или считается running). */
  version: number
  result: Quote[] | null
  running: Promise<Quote[]> | null
}

const globalForCache = globalThis as unknown as {
  quotesDuplicatesCache?: DuplicatesCache
}

const cache: DuplicatesCache = globalForCache.quotesDuplicatesCache ?? {
  version: -1,
  result: null,
  running: null,
}

if (process.env.NODE_ENV !== 'production') {
  globalForCache.quotesDuplicatesCache = cache
}

/**
 * Для поиска дубликатов сравнивается только сам текст цитаты — без автора,
 * источника и комментария. В части текстов вместо перевода строки сохранился
 * артефакт `/n`, его убираем, иначе одна и та же цитата не сходится сама с собой.
 */
function normalizeQuoteText(text: string): string {
  return normalizeSearchString(text.replace(/\/n/g, ' '))
}

function collectTrigrams(text: string): Set<string> {
  const padded = ` ${text} `
  const trigrams = new Set<string>()

  for (let i = 0; i + 3 <= padded.length; i++) {
    trigrams.add(padded.slice(i, i + 3))
  }

  return trigrams
}

interface TrigramIndex {
  /** Позиция в индексе -> позиция цитаты в исходном массиве. */
  sourceIndex: Int32Array
  /**
   * Триграммы цитаты как id, отсортированные по возрастанию частоты в базе.
   * Редкие идут первыми — на этом стоит префиксный фильтр.
   */
  tokens: Int32Array[]
}

/**
 * Документы упорядочены по числу триграмм, триграммы внутри документа — по
 * редкости. Такой порядок нужен префиксному фильтру в {@link findSimilarPairs}.
 */
function buildTrigramIndex(quotes: Quote[]): TrigramIndex {
  const candidates: number[] = []
  const trigramSets: Set<string>[] = []
  const documentFrequency = new Map<string, number>()

  for (let i = 0; i < quotes.length; i++) {
    const normalized = normalizeQuoteText(quotes[i].text_en)
    if (normalized.length < MIN_NORMALIZED_LENGTH) continue

    const trigrams = collectTrigrams(normalized)
    if (!trigrams.size) continue

    candidates.push(i)
    trigramSets.push(trigrams)

    for (const trigram of trigrams) {
      documentFrequency.set(trigram, (documentFrequency.get(trigram) ?? 0) + 1)
    }
  }

  // id триграмм — по возрастанию частоты: id меньше => триграмма реже.
  const ordered = [...documentFrequency.keys()].sort(
    (a, b) => documentFrequency.get(a)! - documentFrequency.get(b)!,
  )
  const tokenId = new Map<string, number>()
  for (let i = 0; i < ordered.length; i++) tokenId.set(ordered[i], i)

  const positions = candidates.map((_, position) => position)
  positions.sort((a, b) => trigramSets[a].size - trigramSets[b].size)

  const sourceIndex = new Int32Array(positions.length)
  const tokens = new Array<Int32Array>(positions.length)

  for (let k = 0; k < positions.length; k++) {
    const position = positions[k]
    sourceIndex[k] = candidates[position]

    const ids = new Int32Array(trigramSets[position].size)
    let n = 0
    for (const trigram of trigramSets[position])
      ids[n++] = tokenId.get(trigram)!
    ids.sort()

    tokens[k] = ids
  }

  return { sourceIndex, tokens }
}

/**
 * Размер пересечения двух отсортированных массивов id, но со сверкой на ходу:
 * как только даже полное совпадение остатков не даст `required` общих триграмм,
 * возвращаем -1 и не досчитываем. Именно этот выход делает проверку кандидатов
 * дешёвой — их на порядки больше, чем реальных пар.
 */
function boundedIntersectionSize(
  a: Int32Array,
  b: Int32Array,
  required: number,
): number {
  let i = 0
  let j = 0
  let size = 0

  while (i < a.length && j < b.length) {
    if (size + Math.min(a.length - i, b.length - j) < required) return -1

    if (a[i] === b[j]) {
      size++
      i++
      j++
    } else if (a[i] < b[j]) i++
    else j++
  }

  return size
}

/** Сколько общих триграмм нужно паре таких размеров, чтобы дотянуть до порога. */
function requiredOverlap(
  sizeA: number,
  sizeB: number,
  threshold: number,
): number {
  return Math.ceil((threshold / (1 + threshold)) * (sizeA + sizeB))
}

/**
 * Длина префикса, которого достаточно для индексации/поиска: если у документов
 * совпадает хотя бы t-доля триграмм, их префиксы обязаны пересечься. Позволяет
 * не строить индекс по частым триграммам и не перебирать все пары.
 */
function prefixLength(size: number, threshold: number): number {
  return Math.max(size - Math.ceil(threshold * size) + 1, 1)
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

/** Для каждой цитаты — список похожих (позиции в исходном массиве). */
async function findSimilarPairs(
  index: TrigramIndex,
  threshold: number,
): Promise<Map<number, number[]>> {
  const { sourceIndex, tokens } = index
  const neighbours = new Map<number, number[]>()

  // token id -> позиции документов, у которых токен попал в префикс.
  const inverted = new Map<number, number[]>()
  // Отметки просмотренных кандидатов текущего документа (без пересоздания Set).
  const candidateStamp = new Int32Array(tokens.length).fill(-1)
  const candidates: number[] = []

  let deadline = Date.now() + YIELD_INTERVAL_MS

  for (let k = 0; k < tokens.length; k++) {
    const current = tokens[k]
    const size = current.length
    // Документы меньше этого размера не дотянут до порога даже при полном совпадении.
    const minSize = threshold * size
    const probeLength = prefixLength(size, threshold)

    candidates.length = 0

    for (let p = 0; p < probeLength; p++) {
      const postings = inverted.get(current[p])
      if (!postings) continue

      for (const other of postings) {
        // Слишком короткие документы не дотянут до порога — отсеиваем по размеру.
        if (tokens[other].length < minSize) continue
        if (candidateStamp[other] === k) continue

        candidateStamp[other] = k
        candidates.push(other)
      }
    }

    for (const other of candidates) {
      const otherSize = tokens[other].length
      const shared = boundedIntersectionSize(
        current,
        tokens[other],
        requiredOverlap(size, otherSize, threshold),
      )
      if (shared < 0) continue

      const similarity = shared / (size + otherSize - shared)
      if (similarity < threshold) continue

      const a = sourceIndex[k]
      const b = sourceIndex[other]

      const listA = neighbours.get(a)
      if (listA) listA.push(b)
      else neighbours.set(a, [b])

      const listB = neighbours.get(b)
      if (listB) listB.push(a)
      else neighbours.set(b, [a])
    }

    // Индексируем только префикс — остальные триграммы в индекс не попадают.
    const indexLength = prefixLength(size, threshold)
    for (let p = 0; p < indexLength; p++) {
      const token = current[p]
      const postings = inverted.get(token)
      if (postings) postings.push(k)
      else inverted.set(token, [k])
    }

    if (Date.now() >= deadline) {
      await yieldToEventLoop()
      deadline = Date.now() + YIELD_INTERVAL_MS
    }
  }

  return neighbours
}

/**
 * Группы идут подряд: цитата-«затравка», следом все похожие на неё. Порядок
 * тот же, что и у исходного списка цитат.
 */
function groupDuplicates(
  quotes: Quote[],
  neighbours: Map<number, number[]>,
): Quote[] {
  const visited = new Uint8Array(quotes.length)
  const result: Quote[] = []

  for (let i = 0; i < quotes.length; i++) {
    if (visited[i]) continue
    visited[i] = 1

    const similar = neighbours.get(i)
    if (!similar) continue

    const group = [i]

    for (const j of similar) {
      if (visited[j]) continue
      visited[j] = 1
      group.push(j)
    }

    if (group.length > 1) {
      group.sort((a, b) => a - b)
      for (const j of group) result.push(quotes[j])
    }
  }

  return result
}

function resetDuplicatesCache(): void {
  cache.version = -1
  cache.result = null
  cache.running = null
}

async function computeDuplicates(): Promise<Quote[]> {
  const version = getQuotesCacheVersion()

  const quotes = db
    .prepare(`SELECT ${QUOTE_COLUMNS} FROM quotes ORDER BY id`)
    .all() as Quote[]

  const index = buildTrigramIndex(quotes)
  const neighbours = await findSimilarPairs(
    index,
    DUPLICATE_SIMILARITY_THRESHOLD,
  )
  const result = groupDuplicates(quotes, neighbours)

  // Если цитаты успели измениться, отдаём результат вызвавшему, но не кэшируем.
  if (getQuotesCacheVersion() === version) {
    cache.version = version
    cache.result = result
    cache.running = null
  }

  return result
}

/**
 * Возвращает цитаты, сгруппированные по возможным дубликатам (группы идут
 * подряд). Сравнивается только текст цитаты. Результат кэшируется до ближайшего
 * изменения цитат, а параллельные запросы переиспользуют один расчёт.
 */
export async function findDuplicateQuotes(): Promise<Quote[]> {
  const version = getQuotesCacheVersion()

  if (cache.version === version) {
    if (cache.result) return cache.result
    if (cache.running) return cache.running
  }

  const running = computeDuplicates()

  cache.version = version
  cache.result = null
  cache.running = running

  try {
    return await running
  } catch (err) {
    // Не кэшируем провалившийся расчёт — следующий запрос попробует снова.
    if (cache.running === running) resetDuplicatesCache()
    throw err
  }
}
