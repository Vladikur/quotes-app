import { Suspense } from 'react'
import { SearchView } from '@/components/search-view'

export default function HomePage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  )
}
