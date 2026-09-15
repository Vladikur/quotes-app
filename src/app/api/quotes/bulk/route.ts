import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { bulkInsertQuotes } from '@/lib/services/quotes-service'

export async function POST(request: Request) {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  try {
    const { quotes } = await request.json()

    if (!Array.isArray(quotes)) {
      return NextResponse.json({
        success: false,
        message: 'Array of quotes expected',
      })
    }

    for (const quote of quotes) {
      if (
        !quote.author_en ||
        !quote.author_ru ||
        !quote.text_en ||
        !quote.text_ru
      ) {
        return NextResponse.json({
          success: false,
          message: 'author_en, author_ru, text_en, text_ru are required',
        })
      }
    }

    const { addedCount, skippedCount } = await bulkInsertQuotes(quotes)

    if (addedCount === 0) {
      return NextResponse.json({ success: true, message: 'No new quotes' })
    }

    return NextResponse.json({
      success: true,
      message: `Added: ${addedCount}, skipped: ${skippedCount}`,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Bulk upload failed' },
      { status: 500 },
    )
  }
}
