import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import {
  getQuoteById,
  updateQuote,
  deleteQuote,
} from '@/lib/services/quotes-service'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/quotes/[id]'>,
) {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  const { id } = await ctx.params
  const quote = getQuoteById(Number(id))

  if (!quote) {
    return NextResponse.json({ success: false, message: 'Quote not found' })
  }

  return NextResponse.json({ success: true, data: quote })
}

export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/quotes/[id]'>,
) {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  const { id } = await ctx.params
  const body = await request.json()

  const { author_en, author_ru, text_en, text_ru } = body

  if (!author_en || !author_ru || !text_en || !text_ru) {
    return NextResponse.json({
      success: false,
      message: 'author_en, author_ru, text_en, text_ru are required',
    })
  }

  try {
    const updated = await updateQuote(Number(id), body)

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Quote not found' })
    }

    return NextResponse.json({ success: true, message: 'Quote updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Update failed' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/quotes/[id]'>,
) {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  const { id } = await ctx.params
  const deleted = deleteQuote(Number(id))

  return NextResponse.json({ success: deleted })
}
