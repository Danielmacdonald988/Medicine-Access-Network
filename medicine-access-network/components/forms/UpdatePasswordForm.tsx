'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

export function UpdatePasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: { password: string; confirm: string }) => {
    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated. Signing you in…')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message as string}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          {...register('confirm')}
        />
        {errors.confirm && (
          <p className="text-xs text-red-500">{errors.confirm.message as string}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}
