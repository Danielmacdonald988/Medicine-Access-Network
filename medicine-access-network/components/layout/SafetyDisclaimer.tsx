import { AlertTriangle } from 'lucide-react'
import { SAFETY_DISCLAIMER } from '@/lib/constants'

interface SafetyDisclaimerProps {
  compact?: boolean
}

export function SafetyDisclaimer({ compact = false }: SafetyDisclaimerProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        <p>{SAFETY_DISCLAIMER}</p>
      </div>
    )
  }

  return (
    <div className="border-t border-stone-200 bg-stone-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-stone-500">{SAFETY_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
