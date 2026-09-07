import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logomark } from '@/components/icons/logomark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="network-shell grid items-center gap-10 py-10 sm:py-16 lg:min-h-[680px] lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-20">
      <aside className="hidden max-w-md lg:block">
        <div className="mb-7 flex size-24 items-center justify-center rounded-full bg-[#e8eddf] text-[#6b8057]">
          <Logomark className="size-16" strokeWidth={0.9} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Rooted in connection</p>
        <p className="mt-4 font-heading text-[54px] leading-[1.06] tracking-[-0.04em] text-foreground">
          A little guidance.<br /><em className="text-[#657f48]">A world of possibility.</em>
        </p>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
          A place for thoughtful, responsible support. Share your practice and connect with people at their own pace.
        </p>
        <Link href="/facilitators" className="mt-7 inline-flex items-center gap-2 border-b border-[#849376] pb-1.5 text-sm text-foreground hover:text-primary">
          Explore support without an account <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </aside>
      <div className="mx-auto w-full max-w-lg [&_input]:min-h-11 [&_form_button]:min-h-12">{children}</div>
    </div>
  )
}
