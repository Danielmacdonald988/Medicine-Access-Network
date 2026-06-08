'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { reviewSchema } from '@/lib/validations'

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  label,
  error,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  error?: string
}) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          >
            <Star
              className={`size-7 transition-colors ${
                active >= n
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-stone-200 hover:text-stone-300'
              }`}
            />
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

const formSchema = reviewSchema

type FormValues = z.infer<typeof formSchema>

interface ReviewFormProps {
  bookingRequestId: string
  facilitatorName: string
  onSuccess?: () => void
}

export function ReviewForm({ bookingRequestId, facilitatorName, onSuccess }: ReviewFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      safety_rating: 0,
      integration_rating: 0,
      text: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, booking_request_id: bookingRequestId }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
    onSuccess?.()
  }

  if (submitted) {
    return (
      <div className="space-y-1 py-6 text-center">
        <p className="font-medium text-emerald-700">Review submitted</p>
        <p className="text-sm text-stone-500">
          Thank you for sharing your experience. Your review helps others find safe,
          trusted support.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <p className="text-sm text-stone-600">
        Share your experience with <span className="font-medium">{facilitatorName}</span>.
        Your review is anonymous to other seekers and helps others make informed choices.
      </p>

      {/* Overall rating */}
      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <StarPicker
            value={field.value}
            onChange={field.onChange}
            label="Overall rating"
            error={errors.rating?.message}
          />
        )}
      />

      {/* Safety rating */}
      <Controller
        name="safety_rating"
        control={control}
        render={({ field }) => (
          <StarPicker
            value={field.value}
            onChange={field.onChange}
            label="Safety & boundaries"
            error={errors.safety_rating?.message}
          />
        )}
      />

      {/* Integration / support rating */}
      <Controller
        name="integration_rating"
        control={control}
        render={({ field }) => (
          <StarPicker
            value={field.value}
            onChange={field.onChange}
            label="Integration & support quality"
            error={errors.integration_rating?.message}
          />
        )}
      />

      {/* Written review */}
      <div className="space-y-1.5">
        <Label htmlFor="review-text">Your review</Label>
        <Textarea
          id="review-text"
          rows={5}
          placeholder="Describe your experience — what was helpful, how the guide supported you, and anything others should know."
          {...register('text')}
        />
        {errors.text && (
          <p className="text-xs text-red-500">{errors.text.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </Button>

      <p className="text-center text-xs text-stone-400">
        Reviews are tied to verified completed conversations and cannot be anonymous.
      </p>
    </form>
  )
}
