import type { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Вход — Цитаты',
}

export default function LoginPage() {
  return <LoginForm />
}
