'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { contactRequestFormSchema } from '@/lib/validations'
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

interface ContactRequestFormProps {
  facilitatorProfileId: string
  facilitatorDisplayName: string
}

// ─── Form ─────────────────────────────────────────────────────────────────────
// No account required — this posts to the stateless /api/contact-requests
// endpoint. Nothing here ever displays or requires a facilitator's contact
// details; the seeker's own name/email travel with the request so the
// facilitator can reply.

export function ContactRequestForm({
  facilitatorProfileId,
  facilitatorDisplayName,
}: ContactRequestFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactRequestFormSchema),
    defaultValues: {
      preferred_time_window: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ack_safety: undefined as any,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    // ack_safety is validation-only — strip before sending to API. The
    // honeypot field (`website`) is intentionally NOT part of the
    // react-hook-form–managed data; it's read directly off the DOM at
    // submit time below so autofill/password-manager tools that populate
    // every field on a page are more likely to trip it too.
    const { ack_safety: _a, ...submitData } = data
    const honeypotEl = document.getElementById('website') as HTMLInputElement | null

    const res = await fetch('/api/contact-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...submitData,
        facilitator_profile_id: facilitatorProfileId,
        website: honeypotEl?.value ?? '',
      }),
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
        <p className="font-medium text-emerald-700">Message sent</p>
        <p className="text-sm text-stone-500">
          {facilitatorDisplayName} will reach out by email if there is a good fit. No
          payment is required at this stage.
        </p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* Honeypot — hidden from real visitors (off-screen, not display:none,
          and unreachable by keyboard/AT), never validated client-side so a
          bot that fills it gets no hint it was a trap. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* 1. Contact details */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="seeker_name">Your name</Label>
          <Input id="seeker_name" placeholder="Jane Doe" {...register('seeker_name')} />
          {errors.seeker_name && (
            <p className="text-xs text-red-500">{errors.seeker_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seeker_email">Your email</Label>
          <Input
            id="seeker_email"
            type="email"
            placeholder="you@example.com"
            {...register('seeker_email')}
          />
          {errors.seeker_email && (
            <p className="text-xs text-red-500">{errors.seeker_email.message}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-stone-400">
        Only {facilitatorDisplayName} sees this — it&apos;s never shown publicly and is
        used solely so they can reply to you.
      </p>

      {/* 2. Type of support */}
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

      {/* 3. Preferred format */}
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

      {/* 4. Message */}
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

      {/* 5. Preferred time window */}
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

      {/* 6. Safety acknowledgement */}
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
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>

      <p className="text-center text-xs text-stone-400">
        No account or payment required to send a message.
      </p>
    </form>
  )
}
