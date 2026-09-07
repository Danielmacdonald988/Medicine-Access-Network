import type { SVGProps } from 'react'
import { Flower2 } from 'lucide-react'

/** The network's open flower mark, shared across the site. */
export function Logomark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <Flower2
      aria-hidden="true"
      strokeWidth={1.3}
      className={className}
      {...props}
    />
  )
}
