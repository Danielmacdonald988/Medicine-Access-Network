'use client'

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
      toast.error(error.message)
      return
    }

    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="py-4 text-center space-y-2">
        <p className="font-medium text-emerald-700">Check your inbox</p>
        <p className="text-sm text-stone-500">
          We sent a confirmation link to your email. Click it to activate your account and
          start your guide application.
        </p>
        <p className="text-xs text-stone-400 pt-2">
          Didn&apos;t receive it? Check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" autoComplete="name" {...register('full_name')} />
        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-xs text-stone-400">
        Your account is for managing a guide profile. Profiles require review before publication.
      </p>
    </form>
  )
}
