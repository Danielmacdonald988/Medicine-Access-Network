'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'
import { recordEngagement } from '@/lib/engagement-client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { signUpSchema, type SignUpInput } from '@/lib/validations'

// Save initial interest as an unconfirmed facilitator account.
// The full application and publication review happen after email verification.
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
    recordEngagement('signup_started')
    let error: { message: string } | null
    try {
    ;({ error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
        // Read by the handle_new_user() DB trigger to populate the
        // public.users row automatically. Always 'facilitator' — see
        // db/migrations/0001+ and lib/auth.ts's getCurrentUser() self-heal,
        // which use the same default now that seekers have no accounts.
        data: {
          full_name: data.full_name,
          role: 'facilitator',
          instagram_handle: data.instagram_handle?.replace(/^@/, '') || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    }))
    } catch {
      recordEngagement('signup_error')
      toast.error(t('We could not send your link. Check your connection and try again.'))
      return
    }

    if (error) {
      recordEngagement('signup_error')
      toast.error(t(error.message))
      return
    }

    recordEngagement('signup_accepted')
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div role="status" className="py-4 text-center space-y-2">
        <p className="font-medium text-emerald-700">{t("Check your inbox")}</p>
        <p className="text-sm text-stone-500">{t("Check your email for a secure link to continue. If you’re new here, your details are saved so you can complete your profile later.")}</p>
        <p className="text-xs text-stone-400 pt-2">{t("Didn't receive it? Check your spam folder.")}</p>
        <Button type="button" variant="outline" onClick={() => setConfirmed(false)}>{t("Edit email or request another link")}</Button>
      </div>
    )
  }

  return (
    <form onChange={() => recordEngagement('signup_started')} onSubmit={handleSubmit(onSubmit, () => { recordEngagement('signup_started'); recordEngagement('signup_error') })} className="space-y-4">
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
        <Label htmlFor="instagram_handle">{t("Instagram handle (optional)")}</Label>
        <Input id="instagram_handle" placeholder="@yourpractice" autoCapitalize="none" autoCorrect="off" spellCheck={false} {...register('instagram_handle')} />
        {errors.instagram_handle && <p className="text-xs text-red-500">{t(errors.instagram_handle.message ?? "")}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('Sending your link…') : t('Join the network')}
      </Button>

      <p className="text-center text-xs text-stone-400">{t("No password needed. Complete your application later. Every profile is reviewed before publication.")}</p>
    </form>
  )
}
