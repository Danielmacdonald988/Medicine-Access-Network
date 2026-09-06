import Link from 'next/link'
import { Logomark } from '@/components/icons/logomark'
import { SafetyDisclaimer } from './SafetyDisclaimer'
import { APP_NAME } from '@/lib/constants'

const footerLinks = {
  Platform: [
    { href: '/facilitators', label: 'Find a guide' },
    { href: '/saved', label: 'Saved guides' },
    { href: '/#process-heading', label: 'How it works' },
    { href: '/onboarding/facilitator', label: 'List your practice' },
  ],
  'Safety Library': [
    { href: '/resources', label: 'Browse resources' },
    { href: '/resources/preparation-basics', label: 'Preparation' },
    { href: '/resources/integration-basics', label: 'Integration' },
    { href: '/resources/red-flags', label: 'Red Flags' },
    { href: '/resources/emergency', label: 'Urgent support' },
  ],
  'About & help': [
    { href: '/about', label: 'About & profile review' },
    { href: '/contact', label: 'Contact & report a concern' },
    { href: '/resources/questions-to-ask', label: 'Choosing a guide' },
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
              <Logomark className="h-4 w-4 text-emerald-700" />
              <span className="text-sm">{APP_NAME}</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              A discovery platform for preparation and integration facilitators, coaches, and
              guides. Education, preparation, and integration only.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-600">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
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
