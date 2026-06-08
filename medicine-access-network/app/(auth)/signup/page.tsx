import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUpForm } from '@/components/forms/SignUpForm'

export const metadata: Metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Join as a seeker looking for support, or apply as a guide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="flex justify-center border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
