'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: { email: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="py-4 text-center space-y-2">
        <p className="font-medium text-emerald-700">Check your email</p>
        <p className="text-sm text-stone-500">
          We sent a password reset link. It expires in 1 hour.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message as string}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}
