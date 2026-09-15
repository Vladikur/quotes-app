import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { findDuplicateQuotes } from '@/lib/services/quotes-duplicates'

export async function POST() {
  const auth = await requireRole('editor')
  if ('response' in auth) return auth.response

  try {
    const data = await findDuplicateQuotes()
    return NextResponse.json({ success: true, count: data.length, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Duplicate search failed' },
      { status: 500 },
    )
  }
}
