'use client'

import { useI18n } from '@/i18n/context'
import { consciousBeings } from '@/i18n/conscious-beings'

export function ConsciousBeingsView() {
  const { t, lang } = useI18n()

  const beings = consciousBeings[lang]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-medium tracking-tight">
        {t('consciousBeings.title')}
      </h1>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="w-10 py-2 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">
              {t('consciousBeings.name')}
            </th>
            <th className="py-2 pr-2 font-medium whitespace-nowrap">
              {t('consciousBeings.year')}
            </th>
            <th className="hidden py-2 font-medium sm:table-cell">
              {t('consciousBeings.category')}
            </th>
          </tr>
        </thead>
        <tbody>
          {beings.map((b, i) => (
            <tr key={i} className="border-b border-border/60 align-top">
              <td className="py-2 pr-2 text-muted-foreground tabular-nums">
                {i + 1}
              </td>
              <td className="py-2 pr-2">
                <div>{b.name}</div>
                {b.description && (
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {b.description}
                  </div>
                )}
              </td>
              <td className="py-2 pr-2 whitespace-nowrap">{b.era}</td>
              <td className="hidden py-2 text-muted-foreground sm:table-cell">
                {b.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
