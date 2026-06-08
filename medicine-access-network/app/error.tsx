'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry, Datadog).
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-5xl font-bold text-stone-200">!</p>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-500">
        An unexpected error occurred. You can try again or return to the home page.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-stone-400">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset} className="bg-emerald-700 hover:bg-emerald-800">
          Try again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go home
        </Button>
      </div>
    </div>
  )
}
