export interface Quote {
  id: number
  author_en: string
  author_ru: string
  text_en: string
  text_ru: string
  source_en: string | null
  source_ru: string | null
  robert_comment_en: string | null
  robert_comment_ru: string | null
  /** 1 — автор входит в список «Сознательных существ», 0 — нет. */
  conscious_being: number
  created_at: string
}

export interface ScoredQuote extends Quote {
  score?: number
}

export interface QuoteWithEmbeddings extends Quote {
  embedding_en_blob: Buffer | null
  embedding_ru_blob: Buffer | null
  embedding_en: Float32Array | null
  embedding_ru: Float32Array | null
  search_blob: string
}

export type Role = 'student' | 'editor'

export interface QuoteInput {
  author_en: string
  author_ru: string
  text_en: string
  text_ru: string
  source_en?: string | null
  source_ru?: string | null
  robert_comment_en?: string | null
  robert_comment_ru?: string | null
  /** Не передан — значение в БД не меняется. */
  conscious_being?: number
}
