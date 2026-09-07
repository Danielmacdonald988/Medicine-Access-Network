'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { signUpSchema, type SignUpInput } from '@/lib/validations'

// Seekers have no accounts — this form only ever creates a facilitator
// application. No role selector: there's nothing left to choose.
export function SignUpForm() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [confirmed, setConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // Read by the handle_new_user() DB trigger to populate the
        // public.users row automatically. Always 'facilitator' — see
        // db/migrations/0001+ and lib/auth.ts's getCurrentUser() self-heal,
        // which use the same default now that seekers have no accounts.
        data: {
          full_name: data.full_name,
          role: 'facilitator',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(t(error.message))
      return
    }

    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="py-4 text-center space-y-2">
        <p className="font-medium text-emerald-700">{t("Check your inbox")}</p>
        <p className="text-sm text-stone-500">{t("We sent a confirmation link to your email. Click it to activate your account and start your guide application.")}</p>
        <p className="text-xs text-stone-400 pt-2">{t("Didn't receive it? Check your spam folder.")}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">{t("Full name")}</Label>
        <Input id="full_name" autoComplete="name" {...register('full_name')} />
        {errors.full_name && <p className="text-xs text-red-500">{t(errors.full_name.message ?? "")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("Email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{t(errors.email.message ?? "")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("Password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{t(errors.password.message ?? "")}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('Creating account…') : t('Create account')}
      </Button>

      <p className="text-center text-xs text-stone-400">{t("Your account is for managing a guide profile. Profiles require review before publication.")}</p>
    </form>
  )
}
