'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { signUpSchema, type SignUpInput } from '@/lib/validations'

export function SignUpForm() {
  const supabase = createClient()
  const [role, setRole] = useState<'seeker' | 'facilitator'>('seeker')
  const [confirmed, setConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: 'seeker' },
  })

  const onSubmit = async (data: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // These values are read by the handle_new_user() DB trigger
        // to populate the public.users row automatically.
        data: {
          full_name: data.full_name,
          role: data.role,
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
          We sent a confirmation link to your email. Click it to activate your account.
        </p>
        <p className="text-xs text-stone-400 pt-2">
          Didn&apos;t receive it? Check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role selector */}
      <div className="space-y-1.5">
        <Label>I am joining as a</Label>
        <Tabs
          value={role}
          onValueChange={(v) => {
            const r = v as 'seeker' | 'facilitator'
            setRole(r)
            setValue('role', r)
          }}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="seeker" className="flex-1">
              Seeker
            </TabsTrigger>
            <TabsTrigger value="facilitator" className="flex-1">
              Guide / Facilitator
            </TabsTrigger>
          </TabsList>
          <TabsContent value="seeker">
            <p className="text-xs text-stone-500 mt-1">
              Looking for preparation, integration, breathwork, or somatic support.
            </p>
          </TabsContent>
          <TabsContent value="facilitator">
            <p className="text-xs text-stone-500 mt-1">
              Offering legal preparation, integration, breathwork, or somatic services.
            </p>
          </TabsContent>
        </Tabs>
        <input type="hidden" value={role} {...register('role')} />
      </div>

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
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
