import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Account setup issue' }

// Every reason that lands here is a genuine, logged query/lookup failure —
// see app/auth/callback/route.ts. There is no "new user, no profile yet"
// case anymore; that routes to /onboarding/facilitator instead. Copy here
// is deliberately generic (no raw DB error text — that goes to server
// logs only) but distinguishes *what* failed so support has a starting
// point without needing to reproduce the issue from scratch.
const REASON_COPY: Record<string, string> = {
  profile_lookup_failed:
    "You're signed in, but we couldn't load your account. This has been logged on our end.",
  facilitator_profile_lookup_failed:
    "You're signed in, but we couldn't check your guide application status. This has been logged on our end.",
}

const DEFAULT_MESSAGE =
  "You're signed in, but we couldn't finish setting up your account. This has been logged on our end."

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const message = (reason && REASON_COPY[reason]) || DEFAULT_MESSAGE

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-stone-200">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>
          <CardTitle className="text-xl">We hit a snag setting up your account</CardTitle>
          <CardDescription>
            {message} Signing out and back in often resolves it — if it keeps happening,
            please contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800">
            <a href="/api/auth/signout">Sign out and try again</a>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-500">
            Still stuck?{' '}
            <Link href="/" className="font-medium text-emerald-700 hover:underline">
              Return home
            </Link>{' '}
            or contact support.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
