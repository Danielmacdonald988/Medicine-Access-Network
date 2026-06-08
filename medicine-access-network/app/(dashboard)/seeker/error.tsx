'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function SeekerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[seeker dashboard error]', error)
  }, [error])

  return (
    <div className="py-24 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Dashboard unavailable</h2>
      <p className="mt-2 text-sm text-stone-500">
        There was a problem loading your dashboard. Please try again.
      </p>
      <Button onClick={reset} className="mt-8 bg-emerald-700 hover:bg-emerald-800">
        Reload dashboard
      </Button>
    </div>
  )
}
