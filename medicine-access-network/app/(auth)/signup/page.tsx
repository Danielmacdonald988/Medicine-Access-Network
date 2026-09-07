import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUpForm } from '@/components/forms/SignUpForm'

export const metadata: Metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <Card className="gap-6 rounded-2xl border border-border bg-card py-7 shadow-[0_12px_45px_#203e3406] ring-0 sm:py-8">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <CardTitle className="font-heading text-[40px] leading-[1.05] tracking-[-0.035em]"><h1>Share your practice</h1></CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Create an account to submit your facilitator application. Looking for support
          instead? You don&apos;t need an account —{' '}
          <Link href="/facilitators" className="font-medium text-emerald-700 hover:underline">
            browse guides directly
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <SignUpForm />
      </CardContent>
      <CardFooter className="justify-center border-t border-border bg-muted/50 px-6 py-5 text-center sm:px-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
