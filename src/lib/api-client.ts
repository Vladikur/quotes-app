import type { Quote, QuoteInput, ScoredQuote } from './types'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login'
  ) {
    // Hard navigation on purpose: this runs outside the React tree and should
    // also drop any stale client state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login'
  }

  return res.json() as Promise<T>
}

export interface SearchQuotesParams {
  search?: string | null
  searchId?: string | null
  strict?: boolean
  page: number
  limit: number
}

export interface SearchQuotesResponse {
  success: boolean
  count: number
  page: number
  limit: number
  lang?: 'ru' | 'en'
  searchId?: string
  data: ScoredQuote[]
}

export function fetchQuotes(params: SearchQuotesParams) {
  return apiFetch<SearchQuotesResponse>('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function fetchDuplicateQuotes() {
  return apiFetch<{ success: boolean; count: number; data: Quote[] }>(
    '/api/quotes/duplicates',
    {
      method: 'POST',
    },
  )
}

export function fetchQuoteById(id: number | string) {
  return apiFetch<{ success: boolean; message?: string; data: Quote }>(
    `/api/quotes/${id}`,
  )
}

export function updateQuoteApi(id: number | string, quote: QuoteInput) {
  return apiFetch<{ success: boolean; message: string }>(`/api/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quote),
  })
}

export function deleteQuoteApi(id: number | string) {
  return apiFetch<{ success: boolean }>(`/api/quotes/${id}`, {
    method: 'DELETE',
  })
}

export function uploadQuotesApi(quotes: QuoteInput[]) {
  return apiFetch<{ success: boolean; message: string }>('/api/quotes/bulk', {
    method: 'POST',
    body: JSON.stringify({ quotes }),
  })
}
