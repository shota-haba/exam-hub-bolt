'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      router.push(`/dashboard?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <Input
        placeholder="試験を検索..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        disabled={isPending}
      />
    </div>
  )
}