'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { loginSchema, type LoginInput } from '@/lib/validations'
import Link from 'next/link'
import { safeRedirectPath } from '@/lib/safe-redirect'

export function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(t(error.message))
      return
    }

    // Honour the ?next= redirect param from middleware (e.g. user tried to visit /admin)
    const destination = safeRedirectPath(searchParams.get('next'))

    // /dashboard is a server-side dispatcher that reads the role (and self-heals
    // the profile row if needed) before routing — avoids duplicating that logic
    // here and getting out of sync with it.
    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("Email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{t(errors.email.message ?? "")}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("Password")}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-stone-400 hover:text-emerald-700"
          >{t("Forgot password?")}</Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{t(errors.password.message ?? "")}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('Signing in…') : t('Sign in')}
      </Button>
    </form>
  )
}
