import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { SafetyDisclaimer } from './SafetyDisclaimer'
import { APP_NAME } from '@/lib/constants'

const footerLinks = {
  Platform: [
    { href: '/facilitators', label: 'Find a Guide' },
    { href: '/onboarding/facilitator', label: 'Become a Guide' },
    { href: '/onboarding/seeker', label: 'Seeker Onboarding' },
  ],
  'Safety Library': [
    { href: '/resources', label: 'All Guides' },
    { href: '/resources/preparation-basics', label: 'Preparation' },
    { href: '/resources/integration-basics', label: 'Integration' },
    { href: '/resources/red-flags', label: 'Red Flags' },
    { href: '/resources/emergency', label: 'Emergency Disclaimer' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
              <Leaf className="h-4 w-4 text-emerald-700" />
              <span className="text-sm">{APP_NAME}</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              A trusted discovery platform for plant medicine-adjacent facilitators, coaches, and
              guides. Education, preparation, and integration only.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-stone-500 hover:text-stone-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-stone-200 pt-6">
          <p className="text-center text-xs text-stone-400">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>

      <SafetyDisclaimer />
    </footer>
  )
}
