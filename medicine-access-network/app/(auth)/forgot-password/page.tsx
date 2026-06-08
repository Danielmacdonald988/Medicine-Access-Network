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
    <Card className="border-stone-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="flex justify-center border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-500">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
