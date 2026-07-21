import Link from 'next/link'
import { Logomark } from '@/components/icons/logomark'
import { APP_NAME } from '@/lib/constants'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-stone-700">
        <Logomark className="h-5 w-5 text-emerald-700" />
        <span className="text-sm font-semibold">{APP_NAME}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
