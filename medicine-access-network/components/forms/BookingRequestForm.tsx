'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { bookingRequestFormSchema } from '@/lib/validations'
import { PREFERRED_FORMATS } from '@/lib/constants'

// ─── Options ──────────────────────────────────────────────────────────────────

const SUPPORT_SERVICES = [
  'Preparation coaching',
  'Integration coaching',
  'Breathwork session',
  'Somatic coaching',
  'Harm reduction consultation',
  'General consultation',
] as const

const TIME_WINDOWS = [
  'No preference — flexible',
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weekends',
  'Mornings only',
  'Evenings only',
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingRequestFormProps {
  facilitatorId: string
  isAuthenticated: boolean
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function BookingRequestForm({
  facilitatorId,
  isAuthenticated,
}: BookingRequestFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const pathname = usePathname()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingRequestFormSchema),
    defaultValues: {
      preferred_time_window: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ack_safety: undefined as any,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    // ack_safety is validation-only — strip before sending to API
    const { ack_safety: _a, ...submitData } = data

    const res = await fetch('/api/booking-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...submitData, facilitator_id: facilitatorId }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="space-y-1 py-4 text-center">
        <p className="font-medium text-emerald-700">Request sent</p>
        <p className="text-sm text-stone-500">
          The guide will reach out if there is a good fit. No payment is required
          at this stage.
        </p>
      </div>
    )
  }

  // ── Unauthenticated gate ─────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="space-y-3 py-2 text-center">
        <p className="text-sm text-stone-600">
          Sign in to send a conversation request.
        </p>
        <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
            Sign in to continue
          </Link>
        </Button>
        <p className="text-xs text-stone-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline hover:text-stone-600">
            Create one free
          </Link>
        </p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* 1. Type of support */}
      <div className="space-y-1.5">
        <Label>Type of support</Label>
        <Select
          onValueChange={(v) => setValue('requested_service', v as string)}
        >
          <SelectTrigger>
            <SelectValue placeholder="What are you looking for?" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_SERVICES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.requested_service && (
          <p className="text-xs text-red-500">
            {errors.requested_service.message}
          </p>
        )}
      </div>

      {/* 2. Preferred format */}
      <div className="space-y-1.5">
        <Label>Preferred format</Label>
        <Select
          onValueChange={(v) =>
            setValue(
              'preferred_format',
              v as 'voice' | 'video' | 'in_person' | 'async'
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="How would you like to connect?" />
          </SelectTrigger>
          <SelectContent>
            {PREFERRED_FORMATS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.preferred_format && (
          <p className="text-xs text-red-500">
            {errors.preferred_format.message}
          </p>
        )}
      </div>

      {/* 3. Message */}
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Share where you are in your journey and what kind of support you're looking for. The more context you share, the better the guide can assess fit."
          {...register('message')}
        />
        {errors.message && (
          <p className="text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      {/* 4. Preferred time window */}
      <div className="space-y-1.5">
        <Label>Preferred time window</Label>
        <Select
          onValueChange={(v) => setValue('preferred_time_window', v as string)}
        >
          <SelectTrigger>
            <SelectValue placeholder="When works for you?" />
          </SelectTrigger>
          <SelectContent>
            {TIME_WINDOWS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-stone-400">Optional — helps the guide plan.</p>
      </div>

      {/* 5. Safety acknowledgement */}
      <p className="text-xs text-stone-400">
        Unsure about something?{' '}
        <Link
          href="/resources/questions-to-ask"
          className="underline hover:text-stone-600"
          target="_blank"
        >
          Questions to ask a guide
        </Link>
        {' '}·{' '}
        <Link
          href="/resources/red-flags"
          className="underline hover:text-stone-600"
          target="_blank"
        >
          Red flags to watch for
        </Link>
      </p>
      <Controller
        name="ack_safety"
        control={control}
        render={({ field }) => (
          <div
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all select-none',
              field.value
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-stone-200'
            )}
            onClick={() => field.onChange(field.value ? undefined : true)}
          >
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(checked) =>
                field.onChange(checked ? true : undefined)
              }
              className="mt-0.5 shrink-0"
            />
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-stone-400" />
              <span className="text-xs leading-relaxed text-stone-600">
                I understand this is not a medical service, guides are not
                emergency providers, and this platform does not coordinate access
                to controlled substances.
              </span>
            </div>
          </div>
        )}
      />
      {errors.ack_safety && (
        <p className="text-xs text-red-500">{errors.ack_safety.message}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending…' : 'Request conversation'}
      </Button>

      <p className="text-center text-xs text-stone-400">
        No payment required to send a request.
      </p>
    </form>
  )
}
