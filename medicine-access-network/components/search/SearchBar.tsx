'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.push(`/facilitators?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          ref={inputRef}
          defaultValue={searchParams.get('q') ?? ''}
          placeholder="Search by name, modality, or location…"
          className="pl-9"
        />
      </div>
      <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">
        Search
      </Button>
    </form>
  )
}
