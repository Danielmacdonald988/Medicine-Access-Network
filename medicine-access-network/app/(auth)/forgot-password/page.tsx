import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset password' }

export default function ForgotPasswordPage() {
  return (
    <Card className="gap-6 rounded-2xl border border-border bg-card py-7 shadow-[0_12px_45px_#203e3406] ring-0 sm:py-8">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <CardTitle className="font-heading text-[40px] leading-[1.05] tracking-[-0.035em]"><h1>Reset your password</h1></CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="justify-center border-t border-border bg-muted/50 px-6 py-5 text-center sm:px-8">
        <p className="text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
