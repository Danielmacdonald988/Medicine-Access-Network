import { getTranslation } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/forms/LoginForm'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation()
  return { title: t('Sign in') }
}

export default async function LoginPage() {
  const { t } = await getTranslation()
  return (
    <Card className="gap-6 rounded-2xl border border-border bg-card py-7 shadow-[0_12px_45px_#203e3406] ring-0 sm:py-8">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <CardTitle className="font-heading text-[40px] leading-[1.05] tracking-[-0.035em]"><h1>{t("Welcome back")}</h1></CardTitle>
        <CardDescription className="text-sm leading-relaxed">{t("Sign in to manage your facilitator profile and connections.")}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center border-t border-border bg-muted/50 px-6 py-5 text-center sm:px-8">
        <p className="text-sm text-muted-foreground">{t("Don't have an account?")}{' '}
          <Link href="/signup" className="font-medium text-emerald-700 hover:underline">{t("Sign up")}</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
