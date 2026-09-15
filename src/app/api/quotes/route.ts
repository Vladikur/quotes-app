import { NextResponse } from 'next/server'
import { searchQuotes } from '@/lib/services/quotes-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await searchQuotes(body)

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'Search failed' },
      { status: 500 },
    )
  }
}
