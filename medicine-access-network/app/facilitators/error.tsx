'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FacilitatorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[facilitators error]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-lg font-semibold text-stone-900">
          Could not load guides
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          There was a problem loading the guide directory. This is usually temporary.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset} className="bg-emerald-700 hover:bg-emerald-800">
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
