'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { CheckIcon, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase'
import { facilitatorOnboardingSchema } from '@/lib/validations'
import { MODALITIES, MODALITY_CATEGORIES, APP_NAME } from '@/lib/constants'

// ─── Step metadata ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 12

const STEP_META: Record<number, { title: string; description: string }> = {
  1: {
    title: 'How should seekers address you?',
    description: 'Your display name will appear on your public profile.',
  },
  2: {
    title: 'Where are you based?',
    description: 'Helps seekers find in-person support in their area.',
  },
  3: {
    title: 'Do you offer remote sessions?',
    description: 'Remote work can include video, voice, and async support.',
  },
  4: {
    title: 'Tell us about your practice',
    description:
      'Your bio is the centrepiece of your public profile. Be specific, honest, and human.',
  },
  5: {
    title: 'What modalities do you offer?',
    description: 'Select every practice you actively provide to clients.',
  },
  6: {
    title: 'How long have you been doing this work?',
    description:
      "Experience includes meaningful personal practice, not just formal credentials.",
  },
  7: {
    title: 'Training, lineage, and certifications',
    description: 'Share the formal and informal background that informs your work.',
  },
  8: {
    title: 'How do you keep clients safe?',
    description:
      'Required. This section is displayed publicly on your profile and reviewed by our team.',
  },
  9: {
    title: 'Contraindication awareness',
    description:
      'Required. You must confirm awareness of contraindications before submitting.',
  },
  10: {
    title: 'How are you compensated?',
    description: 'All payments are for legal services only. Be transparent with seekers.',
  },
  11: {
    title: 'What is your rate?',
    description: 'Optional — you can update this at any time from your dashboard.',
  },
  12: {
    title: 'Platform agreement',
    description:
      'Please read the platform rules carefully and agree before submitting your application.',
  },
}

const STEP_FIELDS: Record<number, string[]> = {
  1: ['display_name'],
  2: ['location'],
  3: ['remote_available'],
  4: ['bio'],
  5: ['modalities'],
  6: ['years_experience'],
  7: ['lineage_or_training', 'certifications'],
  8: ['safety_practices'],
  9: ['contraindications_acknowledged'],
  10: ['donation_based'],
  11: ['minimum_donation', 'hourly_rate'],
  12: ['platform_agreement'],
}

// ─── Platform rules shown on step 12 ─────────────────────────────────────────

const PLATFORM_RULES = [
  'I offer only legal support services: preparation coaching, integration guidance, breathwork, somatic coaching, meditation guidance, spiritual coaching, harm reduction education, and related legal wellness work.',
  'I will not facilitate illegal ceremonies and will not source, supply, or coordinate access to controlled substances of any kind.',
  `I understand my profile will not appear publicly until it has been reviewed and approved by the ${APP_NAME} team.`,
  'I will keep my safety practices, contraindication screening process, and profile information accurate and up to date.',
  'I understand that approval is not an endorsement of any specific practice, product, or health outcome.',
]

// ─── Grouped modalities for step 5 ───────────────────────────────────────────

const groupedModalities = (
  Object.entries(MODALITY_CATEGORIES) as [keyof typeof MODALITY_CATEGORIES, string][]
)
  .map(([cat, catLabel]) => ({
    category: cat,
    label: catLabel,
    items: MODALITIES.filter((m) => m.category === cat),
  }))
  .filter((g) => g.items.length > 0)

// ─── Progress indicator ───────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 space-y-2">
      <div className="flex gap-1">
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

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="size-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-semibold text-stone-900">Application submitted</h2>
      <p className="mt-3 text-stone-600">
        Your facilitator application has been submitted for review.
      </p>
      <p className="mt-2 text-sm text-stone-500">
        Our team reviews applications within 3–5 business days. You&apos;ll see your
        verification status on your dashboard and will be notified when it changes.
      </p>
      <div className="mt-8">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
          <Link href="/facilitator">Go to your dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function FacilitatorOnboardingForm() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(facilitatorOnboardingSchema),
    defaultValues: {
      display_name: '',
      location: '',
      remote_available: true,
      bio: '',
      modalities: [] as string[],
      years_experience: undefined,
      lineage_or_training: '',
      certifications: '',
      safety_practices: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contraindications_acknowledged: undefined as any,
      donation_based: false,
      minimum_donation: undefined,
      hourly_rate: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform_agreement: undefined as any,
    },
  })

  const bio = watch('bio') ?? ''
  const safetyPractices = watch('safety_practices') ?? ''
  const donationBased = watch('donation_based')

  const advance = async () => {
    const valid = await trigger(
      STEP_FIELDS[step] as Parameters<typeof trigger>[0]
    )
    if (valid) setStep((s) => s + 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    const { platform_agreement: _p, ...rest } = data

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue.')
      return
    }

    const certifications = rest.certifications
      ? (rest.certifications as string)
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean)
      : []

    const { error } = await supabase.from('facilitator_profiles').upsert({
      user_id: user.id,
      display_name: rest.display_name,
      bio: rest.bio,
      location: rest.location || null,
      remote_available: rest.remote_available,
      modalities: rest.modalities,
      years_experience: rest.years_experience ?? null,
      lineage_or_training: rest.lineage_or_training || null,
      certifications,
      safety_practices: rest.safety_practices,
      contraindications_acknowledged: rest.contraindications_acknowledged,
      donation_based: rest.donation_based,
      minimum_donation: rest.minimum_donation ?? null,
      hourly_rate: rest.hourly_rate ?? null,
      verification_status: 'pending',
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) return <ConfirmationScreen />

  const { title, description } = STEP_META[step]

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>

      {/* ── Step 1: Display name ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            placeholder="e.g. Maya Chen or James O."
            autoFocus
            {...register('display_name')}
          />
          {errors.display_name && (
            <p className="text-xs text-red-500">{errors.display_name.message}</p>
          )}
          <p className="text-xs text-stone-400">
            This appears on your public profile. First name or initials is fine.
          </p>
        </div>
      )}

      {/* ── Step 2: Location ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City, State or Country"
            autoFocus
            {...register('location')}
          />
          <p className="text-xs text-stone-400">
            Optional — used to match you with seekers looking for in-person support.
          </p>
        </div>
      )}

      {/* ── Step 3: Remote availability ──────────────────────────────────────── */}
      {step === 3 && (
        <Controller
          name="remote_available"
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
                  Available for remote sessions
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  I can work with clients via video call, voice call, or async messaging.
                </p>
              </div>
            </button>
          )}
        />
      )}

      {/* ── Step 4: Bio ──────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={8}
            placeholder="Describe your background, your approach, and what working with you actually looks like. Be specific and genuine — seekers are looking for a real sense of who you are."
            autoFocus
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-red-500">{errors.bio.message}</p>
          )}
          <div className="flex justify-between">
            <p className="text-xs text-stone-400">Minimum 100 characters.</p>
            <p
              className={cn(
                'text-xs',
                bio.length < 100 ? 'text-amber-600' : 'text-stone-400'
              )}
            >
              {bio.length} / 2000
            </p>
          </div>
        </div>
      )}

      {/* ── Step 5: Modalities ───────────────────────────────────────────────── */}
      {step === 5 && (
        <Controller
          name="modalities"
          control={control}
          render={({ field }) => (
            <div className="space-y-5">
              {groupedModalities.map(({ category, label, items }) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                    {label}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {items.map((m) => {
                      const selected = field.value.includes(m.name)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((v: string) => v !== m.name)
                                : [...field.value, m.name]
                            )
                          }
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                            selected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                              : 'border-stone-200 text-stone-700 hover:border-stone-300'
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                              selected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-stone-300'
                            )}
                          >
                            {selected && <CheckIcon className="size-2.5" />}
                          </div>
                          {m.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {errors.modalities && (
                <p className="text-xs text-red-500">{errors.modalities.message}</p>
              )}
            </div>
          )}
        />
      )}

      {/* ── Step 6: Years of experience ──────────────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-1.5">
          <Label htmlFor="years_experience">Years of experience</Label>
          <Input
            id="years_experience"
            type="number"
            min={0}
            max={50}
            placeholder="0"
            autoFocus
            {...register('years_experience')}
          />
          {errors.years_experience && (
            <p className="text-xs text-red-500">{errors.years_experience.message}</p>
          )}
          <p className="text-xs text-stone-400">
            Optional. Include personal practice, not just formal roles.
          </p>
        </div>
      )}

      {/* ── Step 7: Training & certifications ───────────────────────────────── */}
      {step === 7 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lineage_or_training">Training and lineage</Label>
            <Textarea
              id="lineage_or_training"
              rows={3}
              placeholder="e.g. IFS Level 2, Somatic Experiencing Practitioner (SEP), Grof Transpersonal Training — Holotropic Breathwork Certified"
              autoFocus
              {...register('lineage_or_training')}
            />
            {errors.lineage_or_training && (
              <p className="text-xs text-red-500">{errors.lineage_or_training.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certifications">Certifications</Label>
            <Input
              id="certifications"
              placeholder="e.g. SEP, MAPS MDMA-AT, Certified Breathwork Facilitator"
              {...register('certifications')}
            />
            <p className="text-xs text-stone-400">
              Optional. Comma-separated. These will be listed on your profile.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 8: Safety practices ─────────────────────────────────────────── */}
      {step === 8 && (
        <div className="space-y-1.5">
          <Label htmlFor="safety_practices">Your safety practices and screening process</Label>
          <Textarea
            id="safety_practices"
            rows={7}
            placeholder="Describe your intake process, how you screen for contraindications, which conditions or medications you do not work with, and how you handle crises or emergencies. Be specific — this builds trust with seekers and is reviewed by our team."
            autoFocus
            {...register('safety_practices')}
          />
          {errors.safety_practices && (
            <p className="text-xs text-red-500">{errors.safety_practices.message}</p>
          )}
          <div className="flex justify-between">
            <p className="text-xs text-stone-400">
              Minimum 50 characters. Displayed publicly on your profile.
            </p>
            <p
              className={cn(
                'text-xs',
                safetyPractices.length < 50 ? 'text-amber-600' : 'text-stone-400'
              )}
            >
              {safetyPractices.length} / 1000
            </p>
          </div>
        </div>
      )}

      {/* ── Step 9: Contraindication awareness ──────────────────────────────── */}
      {step === 9 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 leading-relaxed">
            Certain medications, mental health conditions, and physical health factors can make
            participation in plant medicine work, breathwork, and related practices unsafe —
            including but not limited to: MAOIs, lithium, antipsychotics, cardiovascular
            conditions, active psychosis, severe PTSD, pregnancy, and recent major surgery.
            <br />
            <br />
            As a guide on this platform, you commit to conducting appropriate screening with
            every client and declining to work with anyone where a contraindication is present.
          </div>

          <Controller
            name="contraindications_acknowledged"
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
                <span className="text-sm font-medium text-stone-800">
                  I understand and commit to appropriate contraindication screening for every client.
                </span>
              </div>
            )}
          />
          {errors.contraindications_acknowledged && (
            <p className="text-xs text-red-500">
              {errors.contraindications_acknowledged.message}
            </p>
          )}
        </div>
      )}

      {/* ── Step 10: Pricing model ───────────────────────────────────────────── */}
      {step === 10 && (
        <div className="space-y-3">
          <Controller
            name="donation_based"
            control={control}
            render={({ field }) => (
              <>
                {[
                  {
                    value: false,
                    label: 'Set rate',
                    description: 'I charge a fixed session rate or hourly fee.',
                  },
                  {
                    value: true,
                    label: 'Donation-based or sliding scale',
                    description:
                      'I work on a pay-what-you-can or sliding-scale basis.',
                  },
                ].map(({ value, label, description: desc }) => (
                  <button
                    key={String(value)}
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
              </>
            )}
          />
          <p className="text-xs text-stone-400">
            All payments are for legal services only: preparation, integration, breathwork,
            coaching, and education.
          </p>
        </div>
      )}

      {/* ── Step 11: Rate ────────────────────────────────────────────────────── */}
      {step === 11 && (
        <div className="space-y-1.5">
          {donationBased ? (
            <>
              <Label htmlFor="minimum_donation">Suggested minimum donation (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                  $
                </span>
                <Input
                  id="minimum_donation"
                  type="number"
                  min={0}
                  placeholder="0"
                  className="pl-6"
                  autoFocus
                  {...register('minimum_donation')}
                />
              </div>
              <p className="text-xs text-stone-400">
                Optional. Leave blank if you prefer not to set a minimum.
              </p>
            </>
          ) : (
            <>
              <Label htmlFor="hourly_rate">Session rate (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                  $
                </span>
                <Input
                  id="hourly_rate"
                  type="number"
                  min={0}
                  placeholder="0"
                  className="pl-6"
                  autoFocus
                  {...register('hourly_rate')}
                />
              </div>
              <p className="text-xs text-stone-400">
                Optional. Leave blank if you prefer to discuss rates privately.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Step 12: Platform agreement ──────────────────────────────────────── */}
      {step === 12 && (
        <div className="space-y-4">
          <ul className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-5">
            {PLATFORM_RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>

          <Controller
            name="platform_agreement"
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
                <span className="text-sm font-medium text-stone-800">
                  I have read and agree to all of the platform rules above.
                </span>
              </div>
            )}
          />
          {errors.platform_agreement && (
            <p className="text-xs text-red-500">{errors.platform_agreement.message}</p>
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
            {isSubmitting ? 'Submitting…' : 'Submit application'}
          </Button>
        )}
      </div>
    </form>
  )
}
