'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchRecovery() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button variant="outline" disabled={isPending} onClick={() => startTransition(() => router.refresh())}>
      <RefreshCw aria-hidden="true" className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Trying again…' : 'Try again'}
    </Button>
  )
}
