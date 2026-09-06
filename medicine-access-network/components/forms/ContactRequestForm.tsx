'use client'

import { useEffect, useId, useRef, useState } from 'react'
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
import {
  contactRequestFormSchema,
  type ContactRequestFormInput,
} from '@/lib/validations'
import {
  profileFormatOptions,
  profileSupportOptions,
} from '@/lib/contact-options'

const TIME_WINDOWS = [
  'No preference — flexible',
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weekends',
  'Mornings only',
  'Evenings only',
] as const

interface ContactRequestFormProps {
  facilitatorProfileId: string
  facilitatorDisplayName: string
  modalities: string[]
  remoteAvailable: boolean
  location?: string | null
}

export function ContactRequestForm({
  facilitatorProfileId,
  facilitatorDisplayName,
  modalities,
  remoteAvailable,
  location,
}: ContactRequestFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const submissionErrorRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const supportOptions = profileSupportOptions(modalities)
  const formatOptions = profileFormatOptions(remoteAvailable, location)

  useEffect(() => {
    if (submissionError) submissionErrorRef.current?.focus()
  }, [submissionError])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequestFormInput>({
    resolver: zodResolver(contactRequestFormSchema),
    defaultValues: {
      facilitator_profile_id: facilitatorProfileId,
      seeker_name: '',
      seeker_email: '',
      requested_service: '',
      message: '',
      preferred_time_window: '',
    },
  })

  const onSubmit = async (data: ContactRequestFormInput) => {
    setSubmissionError(null)
    try {
      const res = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilitator_profile_id: facilitatorProfileId,
          seeker_name: data.seeker_name.trim(),
          seeker_email: data.seeker_email.trim(),
          requested_service: data.requested_service,
          preferred_format: data.preferred_format,
          message: data.message,
          preferred_time_window: data.preferred_time_window,
          website: honeypot.current?.value ?? '',
        }),
      })
      if (!res.ok) {
        setSubmissionError(
          res.status === 429
            ? 'Too many requests from this connection. Please wait before trying again. Your message is still here.'
            : res.status === 404
              ? 'This guide is no longer available for requests. Your message is still here so you can copy it.'
              : 'We could not send your request. Your message is still here. Please try again later.',
        )
        return
      }
      setSubmitted(true)
    } catch {
      setSubmissionError(
        'We could not confirm whether your request was received. Your message is still here. Retrying may send it twice; wait a moment or contact platform support if you need help.',
      )
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        tabIndex={-1}
        ref={(node) => {
          node?.focus()
        }}
        className="space-y-3 rounded-lg py-4 text-center focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        <p className="font-medium text-emerald-700">
          Conversation request received
        </p>
        <p className="text-sm leading-relaxed text-stone-600">
          Your request is available to {facilitatorDisplayName}. The guide can
          reply to the email address you provided. A response or session is not
          guaranteed.
        </p>
        <p className="text-sm leading-relaxed text-stone-600">
          Check your inbox and spam folder. Timing, fees, and fit still need to
          be agreed with the guide.
        </p>
        <p className="text-sm text-stone-600">
          No account was created and no payment was taken.
        </p>
        <Link
          href="/resources/questions-to-ask"
          className="inline-block text-sm font-medium text-emerald-800 underline underline-offset-4"
        >
          Prepare for your first conversation
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
      className="space-y-4"
      noValidate
      aria-busy={isSubmitting}
    >
      <p className="text-sm leading-relaxed text-stone-600">
        Start with a brief introduction. All fields are required except your
        preferred time window.
      </p>

      <div aria-hidden="true" className="hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          ref={honeypot}
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-name`}>Your name</Label>
        <Input
          id={`${id}-name`}
          autoComplete="name"
          maxLength={200}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.seeker_name}
          aria-describedby={errors.seeker_name ? `${id}-name-error` : undefined}
          className="min-h-11"
          {...register('seeker_name')}
        />
        {errors.seeker_name && (
          <p
            id={`${id}-name-error`}
            role="alert"
            className="text-sm text-red-700"
          >
            {errors.seeker_name.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-email`}>Your email</Label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.seeker_email}
          aria-describedby={`${id}-contact-help${errors.seeker_email ? ` ${id}-email-error` : ''}`}
          className="min-h-11"
          {...register('seeker_email')}
        />
        {errors.seeker_email && (
          <p
            id={`${id}-email-error`}
            role="alert"
            className="text-sm text-red-700"
          >
            {errors.seeker_email.message}
          </p>
        )}
      </div>
      <p
        id={`${id}-contact-help`}
        className="text-sm leading-relaxed text-stone-600"
      >
        Your name, email, and message are shared with this guide and processed
        by the platform to deliver your request. They are not displayed
        publicly. No account is created.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-service`}>Type of support</Label>
        <Controller
          name="requested_service"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || null}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={`${id}-service`}
                ref={field.ref}
                onBlur={field.onBlur}
                aria-required="true"
                aria-invalid={!!errors.requested_service}
                aria-describedby={
                  errors.requested_service ? `${id}-service-error` : undefined
                }
                className="min-h-11 w-full"
              >
                <SelectValue placeholder="What are you looking for?" />
              </SelectTrigger>
              <SelectContent>
                {supportOptions.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.requested_service && (
          <p
            id={`${id}-service-error`}
            role="alert"
            className="text-sm text-red-700"
          >
            {errors.requested_service.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-format`}>How would you prefer to connect?</Label>
        <Controller
          name="preferred_format"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? null}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={`${id}-format`}
                ref={field.ref}
                onBlur={field.onBlur}
                aria-required="true"
                aria-invalid={!!errors.preferred_format}
                aria-describedby={`${id}-format-help${errors.preferred_format ? ` ${id}-format-error` : ''}`}
                className="min-h-11 w-full"
              >
                <SelectValue placeholder="How would you like to connect?">
                  {field.value
                    ? formatOptions.find(
                        (format) => format.value === field.value,
                      )?.label
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p
          id={`${id}-format-help`}
          className="text-sm leading-relaxed text-stone-600"
        >
          The guide can reply to your email. These are preferences to discuss,
          not confirmed session options.{' '}
          {remoteAvailable
            ? 'Online support is listed; confirm whether they can work with you where you live.'
            : 'Online sessions are not listed on this profile.'}
        </p>
        {errors.preferred_format && (
          <p
            id={`${id}-format-error`}
            role="alert"
            className="text-sm text-red-700"
          >
            Please select how you would like to connect.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-message`}>Brief introduction</Label>
        <p
          id={`${id}-message-help`}
          className="text-sm leading-relaxed text-stone-600"
        >
          This message is shared with the guide. Describe the support you want;
          leave out medical records, medication details, trauma histories, and
          other sensitive information. 20–1,000 characters.
        </p>
        <Textarea
          id={`${id}-message`}
          rows={4}
          minLength={20}
          maxLength={1000}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={`${id}-message-help${errors.message ? ` ${id}-message-error` : ''}`}
          placeholder="I’m looking for integration support and would like to learn about your approach, availability, and fees."
          {...register('message')}
        />
        {errors.message && (
          <p
            id={`${id}-message-error`}
            role="alert"
            className="text-sm text-red-700"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-time`}>Preferred time window (optional)</Label>
        <Controller
          name="preferred_time_window"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || null}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={`${id}-time`}
                ref={field.ref}
                onBlur={field.onBlur}
                aria-describedby={`${id}-time-help`}
                className="min-h-11 w-full"
              >
                <SelectValue placeholder="When works for you?" />
              </SelectTrigger>
              <SelectContent>
                {TIME_WINDOWS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p id={`${id}-time-help`} className="text-sm text-stone-500">
          A preference, not a booking. Confirm your time zone with the guide.
        </p>
      </div>

      <p className="text-sm leading-relaxed text-stone-600">
        Before you connect:{' '}
        <Link
          href="/resources/questions-to-ask"
          className="underline underline-offset-2 hover:text-stone-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Questions to ask a guide
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>{' '}
        ·{' '}
        <Link
          href="/resources/red-flags"
          className="underline underline-offset-2 hover:text-stone-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Red flags<span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </p>
      <Controller
        name="ack_safety"
        control={control}
        render={({ field }) => (
          <div
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-3 transition-colors',
              field.value
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-stone-200',
            )}
          >
            <Checkbox
              id={`${id}-safety`}
              ref={field.ref}
              checked={field.value === true}
              onCheckedChange={(checked) =>
                field.onChange(checked ? true : undefined)
              }
              onBlur={field.onBlur}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.ack_safety}
              aria-describedby={
                errors.ack_safety ? `${id}-safety-error` : undefined
              }
              className="mt-0.5 shrink-0"
            />
            <Label
              htmlFor={`${id}-safety`}
              className="cursor-pointer items-start gap-1.5 text-sm font-normal leading-relaxed text-stone-600"
            >
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-stone-500"
              />
              <span>
                I understand this is not a medical service, guides are not
                emergency providers, and this platform does not coordinate
                access to controlled substances.
              </span>
            </Label>
          </div>
        )}
      />
      {errors.ack_safety && (
        <p
          id={`${id}-safety-error`}
          role="alert"
          className="text-sm text-red-700"
        >
          {errors.ack_safety.message}
        </p>
      )}

      {submissionError && (
        <div
          role="alert"
          tabIndex={-1}
          ref={submissionErrorRef}
          className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <p>{submissionError}</p>
          <Link
            href="/contact"
            className="inline-block font-medium underline underline-offset-2"
          >
            Contact platform support
          </Link>
        </div>
      )}

      <Button
        type="submit"
        className="min-h-11 w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending…' : 'Send conversation request'}
      </Button>
      <p className="text-center text-sm text-stone-500">
        No account or payment required. A request does not book a session.
      </p>
    </form>
  )
}
