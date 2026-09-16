import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { structureQuotesFromText } from '@/lib/services/quotes-service'

export async function POST(request: Request) {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Quotes text is required',
      })
    }

    const quotes = await structureQuotesFromText(text)

    if (quotes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'AI found no quotes to add',
      })
    }

    return NextResponse.json({ success: true, data: quotes })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to structure quotes',
      },
      { status: 500 },
    )
  }
}
