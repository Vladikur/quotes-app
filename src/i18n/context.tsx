'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { translations, type Lang, type TranslationDict } from './translations'

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never

type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>
}[keyof T]

export type TranslationKey = Paths<TranslationDict> & string

const LANG_STORAGE_KEY = 'lang'

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'ru'

  const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
  if (saved === 'ru' || saved === 'en') return saved

  return window.navigator.language.startsWith('en') ? 'en' : 'ru'
}

function resolve(dict: TranslationDict, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, dict)

  return typeof value === 'string' ? value : key
}

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru')

  useEffect(() => {
    // Saved language / browser locale is only known client-side; apply after
    // hydration to avoid a server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(detectInitialLang())
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    window.localStorage.setItem(LANG_STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => resolve(translations[lang], key),
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
