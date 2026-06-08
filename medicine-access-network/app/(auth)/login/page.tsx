import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/forms/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex justify-center border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
