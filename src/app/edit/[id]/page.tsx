import type { Metadata } from 'next'
import { EditQuoteForm } from '@/components/edit-quote-form'

export const metadata: Metadata = {
  title: 'Редактирование цитаты — Цитаты',
}

export default async function EditPage({ params }: PageProps<'/edit/[id]'>) {
  const { id } = await params
  return <EditQuoteForm quoteId={id} />
}
