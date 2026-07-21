import type { SVGProps } from 'react'

/**
 * Brand mark — a triangle inscribed in a circle. Drop-in replacement for a
 * lucide-react icon (same viewBox/stroke conventions, inherits currentColor).
 */
export function Logomark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3.4 19.6 16.3H4.4Z" />
    </svg>
  )
}
