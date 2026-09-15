export type QuoteLang = 'ru' | 'en'

export function detectLanguage(text: string | null | undefined): QuoteLang {
  if (!text) return 'en'

  // если есть кириллица — считаем русским
  if (/[а-яё]/i.test(text)) {
    return 'ru'
  }

  return 'en'
}
