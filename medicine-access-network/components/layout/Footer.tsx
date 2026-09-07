import Link from 'next/link'
import { Logomark } from '@/components/icons/logomark'
import { SafetyDisclaimer } from './SafetyDisclaimer'
import { APP_NAME } from '@/lib/constants'

const footerLinks = {
  'Explore the network': [
    { href: '/facilitators', label: 'Explore support' },
    { href: '/saved', label: 'Saved guides' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/onboarding/facilitator', label: 'List your practice' },
  ],
  'Safety library': [
    { href: '/resources', label: 'Browse resources' },
    { href: '/resources/preparation-basics', label: 'Preparation' },
    { href: '/resources/integration-basics', label: 'Integration' },
    { href: '/resources/red-flags', label: 'Red flags' },
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
    <footer className="mt-auto bg-background pt-14 text-foreground sm:pt-16">
      <div className="network-shell">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" aria-label={`${APP_NAME} home`} className="inline-flex items-center gap-2">
              <Logomark className="size-11" />
              <span aria-hidden="true" className="text-lg leading-[1.02] tracking-[-0.035em]">
                the facilitator<br /><strong className="font-semibold">network</strong><span className="text-[#829656]">.</span>
              </span>
            </Link>
            <p className="mt-5 font-heading text-[26px] italic leading-[1.2] text-[#687b59]">
              A little more connection.<br />A world of possibility.
            </p>
            <p className="mt-4 max-w-70 text-sm leading-relaxed text-muted-foreground">
              Find support for preparation, integration, and the path in between.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {heading}
              </h3>
              <ul className="space-y-1">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-9 items-center text-sm leading-relaxed text-foreground underline-offset-4 transition-colors hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <Link href="/contact" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Questions? Get in touch
          </Link>
        </div>
      </div>

      <SafetyDisclaimer />
    </footer>
  )
}
