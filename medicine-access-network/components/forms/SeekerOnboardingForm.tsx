'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase'
import { seekerOnboardingSchema } from '@/lib/validations'
import { EXPERIENCE_LEVELS, SUPPORT_NEEDS } from '@/lib/constants'

// ─── Step metadata ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6

const STEP_META: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Start with your name',
    description: 'How would you like to appear to guides you connect with?',
  },
  2: {
    title: 'Where are you based?',
    description: 'This helps surface guides near you and understand how you prefer to connect.',
  },
  3: {
    title: 'Where are you in your journey?',
    description: 'There is no right answer — honesty helps guides support you well.',
  },
  4: {
    title: 'What kind of support are you looking for?',
    description: 'Select everything that feels relevant. You can update this later.',
  },
  5: {
    title: 'Share your intention',
    description:
      'This is private and shared only with guides you reach out to. Be as specific or as open as you like.',
  },
  6: {
    title: 'A few important acknowledgements',
    description: 'Please read and confirm each statement to complete your profile.',
  },
}

// Fields that belong to each step — used for per-step validation
const STEP_FIELDS: Record<number, string[]> = {
  1: ['display_name'],
  2: ['location', 'remote_preference'],
  3: ['experience_level'],
  4: ['preferred_modalities'],
  5: ['intention'],
  6: ['ack_not_medical', 'ack_no_substances', 'ack_not_emergency'],
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              s <= current ? 'bg-emerald-600' : 'bg-stone-200'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-stone-400">
        Step {current} of {total}
      </p>
    </div>
  )
}

// ─── Safety ack rows ──────────────────────────────────────────────────────────

const SAFETY_ACKS = [
  {
    name: 'ack_not_medical' as const,
    text: 'I understand this platform does not provide medical advice, diagnosis, or treatment. Guides are not licensed healthcare providers.',
  },
  {
    name: 'ack_no_substances' as const,
    text: 'I understand this platform does not sell, source, supply, or coordinate access to controlled substances of any kind.',
  },
  {
    name: 'ack_not_emergency' as const,
    text: 'I understand that guides on this platform are not emergency providers. In a mental health crisis I will contact emergency services.',
  },
]

// ─── Form ─────────────────────────────────────────────────────────────────────

export function SeekerOnboardingForm() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(seekerOnboardingSchema),
    defaultValues: {
      display_name: '',
      location: '',
      remote_preference: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experience_level: undefined as any,
      preferred_modalities: [] as string[],
      intention: '',
      privacy_preference: 'private' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ack_not_medical: undefined as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ack_no_substances: undefined as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ack_not_emergency: undefined as any,
    },
  })

  const advance = async () => {
    const valid = await trigger(STEP_FIELDS[step] as Parameters<typeof trigger>[0])
    if (valid) setStep((s) => s + 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    const {
      ack_not_medical: _a,
      ack_no_substances: _b,
      ack_not_emergency: _c,
      ...profileData
    } = data

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue.')
      return
    }

    const { error } = await supabase
      .from('seeker_profiles')
      .upsert({ user_id: user.id, ...profileData })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Profile saved — welcome to Medicine Access Network.')
    router.push('/seeker')
  }

  const { title, description } = STEP_META[step]

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* Step header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>

      {/* ── Step 1: Display name ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              placeholder="e.g. Alex or A.M."
              autoFocus
              {...register('display_name')}
            />
            {errors.display_name && (
              <p className="text-xs text-red-500">{errors.display_name.message}</p>
            )}
            <p className="text-xs text-stone-400">
              This is how you appear to guides. First name or initials is fine.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Location + remote ────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, State or Country"
              {...register('location')}
            />
            <p className="text-xs text-stone-400">
              Optional — used to surface in-person guides near you.
            </p>
          </div>

          <Controller
            name="remote_preference"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                  field.value
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                    field.value
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-stone-300'
                  )}
                >
                  {field.value && <CheckIcon className="size-3" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    I&apos;m open to remote sessions
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    I&apos;m comfortable working with guides online via video or voice call.
                  </p>
                </div>
              </button>
            )}
          />
        </div>
      )}

      {/* ── Step 3: Experience level ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-3">
          <Controller
            name="experience_level"
            control={control}
            render={({ field }) => (
              <>
                {EXPERIENCE_LEVELS.map(({ value, label, description: desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                      field.value === value
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-stone-200 hover:border-stone-300'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        field.value === value
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-stone-300'
                      )}
                    >
                      {field.value === value && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{label}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                    </div>
                  </button>
                ))}
                {errors.experience_level && (
                  <p className="text-xs text-red-500">{errors.experience_level.message}</p>
                )}
              </>
            )}
          />
        </div>
      )}

      {/* ── Step 4: Support needs ────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-3">
          <Controller
            name="preferred_modalities"
            control={control}
            render={({ field }) => (
              <>
                {SUPPORT_NEEDS.map(({ id, label, description: desc }) => {
                  const selected = field.value.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((v: string) => v !== id)
                            : [...field.value, id]
                        )
                      }
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                        selected
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          selected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-stone-300'
                        )}
                      >
                        {selected && <CheckIcon className="size-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{label}</p>
                        <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                      </div>
                    </button>
                  )
                })}
                {errors.preferred_modalities && (
                  <p className="text-xs text-red-500">
                    {errors.preferred_modalities.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      )}

      {/* ── Step 5: Intention ────────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-1.5">
          <Label htmlFor="intention">What kind of support are you looking for?</Label>
          <Textarea
            id="intention"
            rows={6}
            placeholder="Share what's drawing you here — your goals, questions, or what you're hoping to work through. This stays private until you choose to connect with a guide."
            {...register('intention')}
          />
          {errors.intention && (
            <p className="text-xs text-red-500">{errors.intention.message}</p>
          )}
          <p className="text-xs text-stone-400">
            Private by default. Shared only with guides you reach out to.
          </p>
        </div>
      )}

      {/* ── Step 6: Safety acknowledgements ─────────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              These statements are important. Please read each one carefully before confirming.
            </p>
            <p className="mt-2 text-xs text-amber-700">
              New to this space?{' '}
              <Link href="/resources" className="underline hover:text-amber-900" target="_blank">
                Visit our Safety Library
              </Link>{' '}
              for guides on preparation, integration, and what to look for in a guide.
            </p>
          </div>

          {SAFETY_ACKS.map(({ name, text }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <div
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all select-none',
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
                  <span className="text-sm text-stone-700">{text}</span>
                </div>
              )}
            />
          ))}

          {(errors.ack_not_medical ||
            errors.ack_no_substances ||
            errors.ack_not_emergency) && (
            <p className="text-xs text-red-500">
              Please confirm all three statements above to continue.
            </p>
          )}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            className="text-stone-500"
          >
            Back
          </Button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            onClick={advance}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            {isSubmitting ? 'Saving…' : 'Complete profile'}
          </Button>
        )}
      </div>
    </form>
  )
}
