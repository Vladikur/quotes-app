import type { Metadata } from 'next'
import { ConsciousBeingsView } from '@/components/conscious-beings-view'

export const metadata: Metadata = {
  title: 'Сознательные существа — Цитаты',
}

export default function ConsciousBeingsPage() {
  return <ConsciousBeingsView />
}
