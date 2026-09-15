import type { Metadata } from 'next'
import { BulkUploadForm } from '@/components/bulk-upload-form'

export const metadata: Metadata = {
  title: 'Добавление цитат — Цитаты',
}

export default function BulkPage() {
  return <BulkUploadForm />
}
