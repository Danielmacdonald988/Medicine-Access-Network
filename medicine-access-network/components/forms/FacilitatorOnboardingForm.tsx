'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'
import { useRef, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { CheckIcon, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { facilitatorOnboardingSchema, type FacilitatorOnboardingInput } from '@/lib/validations'
import type { FacilitatorProfile } from '@/lib/types'
import { ProfileMediaFields } from '@/components/profile/ProfileMediaFields'
import { MODALITIES, MODALITY_CATEGORIES, APP_NAME } from '@/lib/constants'

// ─── Step metadata ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 14

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
    title: 'How long have you practised?',
    description:
      'This self-reported total may include personal practice. Explain your experience supporting clients separately in your bio.',
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
    title: 'Add your profile photos',
    description: 'At least one photo is required. Your primary photo helps people recognise you.',
  },
  13: {
    title: 'Let people message you directly',
    description: 'Optional — add links to your own messaging accounts.',
  },
  14: {
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
  12: ['image_paths'],
  13: ['whatsapp_url', 'signal_url', 'telegram_url'],
  14: ['platform_agreement'],
}

// ─── Platform rules shown on step 14 ─────────────────────────────────────────

const PLATFORM_RULES = [
  'I offer only legal support services: preparation coaching, integration guidance, breathwork, somatic coaching, meditation guidance, spiritual coaching, harm reduction education, and related legal wellness work.',
  'I will not facilitate illegal ceremonies and will not source, supply, or coordinate access to controlled substances of any kind.',
  'I understand my profile will not appear publicly until it has been reviewed and approved by {appName}.',
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

function StepIndicator({ current, total, editing }: { current: number; total: number; editing: boolean }) {
  const { t } = useTranslation()
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
        {t(editing ? 'Section {current} of {total}' : 'Step {current} of {total}', { current, total })}
      </p>
    </div>
  )
}

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen({ editing }: { editing: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="size-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-semibold text-stone-900">{t(editing ? 'Profile changes submitted' : 'Application submitted')}</h2>
      <p className="mt-3 text-stone-600">
        {t(editing ? 'Your updated profile has been submitted for review.' : 'Your facilitator application has been submitted for review.')}
      </p>
      <p className="mt-2 text-sm text-stone-500">{t("Your profile stays hidden while it is pending review. Check your dashboard for your application status and any updates.")}</p>
      <div className="mt-8">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
          <Link href="/facilitator">{t("Go to your dashboard")}</Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function FacilitatorOnboardingForm({ existingProfile }: { existingProfile?: FacilitatorProfile }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof facilitatorOnboardingSchema>, unknown, FacilitatorOnboardingInput>({
    resolver: zodResolver(facilitatorOnboardingSchema),
    defaultValues: {
      display_name: existingProfile?.display_name ?? '',
      location: existingProfile?.location ?? '',
      remote_available: existingProfile?.remote_available ?? true,
      bio: existingProfile?.bio ?? '',
      modalities: existingProfile?.modalities ?? [],
      years_experience: existingProfile?.years_experience ?? undefined,
      lineage_or_training: existingProfile?.lineage_or_training ?? '',
      certifications: existingProfile?.certifications?.join(', ') ?? '',
      safety_practices: existingProfile?.safety_practices ?? '',
      contraindications_acknowledged: existingProfile?.contraindications_acknowledged ? true : undefined,
      donation_based: existingProfile?.donation_based ?? false,
      minimum_donation: existingProfile?.minimum_donation ?? undefined,
      hourly_rate: existingProfile?.hourly_rate ?? undefined,
      image_paths: existingProfile?.image_paths ?? [],
      whatsapp_url: existingProfile?.whatsapp_url ?? '',
      signal_url: existingProfile?.signal_url ?? '',
      telegram_url: existingProfile?.telegram_url ?? '',
      platform_agreement: undefined,
    },
  })

  const bio = watch('bio') ?? ''
  const safetyPractices = watch('safety_practices') ?? ''
  const donationBased = watch('donation_based')

  const goToStep = (nextStep: number) => {
    setStep(nextStep)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const advance = async () => {
    if (uploading || isSubmitting) return
    const valid = await trigger(
      STEP_FIELDS[step] as Parameters<typeof trigger>[0]
    )
    if (valid) goToStep(step + 1)
  }

  const onSubmit = async (data: FacilitatorOnboardingInput) => {
    if (uploading) return
    setSaveError('')
    try {
      const response = await fetch('/api/facilitator-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: existingProfile?.id,
          application: data,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || result?.success !== true) {
        setSaveError(typeof result?.error === 'string'
          ? result.error
          : 'Your profile could not be saved. Your entries are still here; please try again.')
        requestAnimationFrame(() => errorRef.current?.focus())
        return
      }

      // An old photo stays attached until this save succeeds. Cleanup is best-effort;
      // the image endpoint also rejects deletion while any profile still uses it.
      const removedPaths = (existingProfile?.image_paths ?? []).filter((path) => !data.image_paths.includes(path))
      for (const path of removedPaths) {
        void fetch('/api/profile-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        }).catch(() => undefined)
      }
      setSubmitted(true)
    } catch {
      setSaveError('Your profile could not be saved. Check your connection and try again; your entries are still here.')
      requestAnimationFrame(() => errorRef.current?.focus())
    }
  }

  if (submitted) return <ConfirmationScreen editing={Boolean(existingProfile)} />

  const { title, description } = STEP_META[step]

  return (
    <form onSubmit={(event) => {
      if (step < TOTAL_STEPS) {
        event.preventDefault()
        void advance()
        return
      }
      void handleSubmit(onSubmit, (invalidFields) => {
        const invalidStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
          fields.some((field) => field in invalidFields)
        )
        if (invalidStep) goToStep(Number(invalidStep[0]))
      })(event)
    }} noValidate>
      {existingProfile && (
        <div className="mb-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-relaxed text-amber-900">
            {t(existingProfile.verification_status === 'approved'
              ? 'Submitting changes will hide your public profile until the updated profile is reviewed and approved.'
              : 'Submitting changes sends your updated profile for review. It stays hidden until approved.')}
          </p>
          <Label htmlFor="edit-profile-section">{t("Jump to a section")}</Label>
          <select
            id="edit-profile-section"
            value={step}
            disabled={uploading || isSubmitting}
            onChange={(event) => goToStep(Number(event.target.value))}
            className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-800"
          >
            {Object.entries(STEP_META).map(([key, section]) => (
              <option key={key} value={key}>{key}. {t(section.title)}</option>
            ))}
          </select>
        </div>
      )}
      <StepIndicator current={step} total={TOTAL_STEPS} editing={Boolean(existingProfile)} />

      <div className="mb-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-stone-900 focus:outline-none">{t(title)}</h2>
        <p className="mt-1 text-sm text-stone-500">{t(description)}</p>
      </div>

      {/* ── Step 1: Display name ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="display_name">{t("Display name")}</Label>
          <Input
            id="display_name"
            placeholder={t("e.g. Maya Chen or James O.")}
            autoFocus={!existingProfile}
            {...register('display_name')}
          />
          {errors.display_name && (
            <p className="text-xs text-red-500">{t(errors.display_name.message ?? "")}</p>
          )}
          <p className="text-xs text-stone-400">{t("This appears on your public profile. First name or initials is fine.")}</p>
        </div>
      )}

      {/* ── Step 2: Location ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("Location")}</Label>
          <Input
            id="location"
            placeholder={t("City, State or Country")}
            autoFocus
            {...register('location')}
          />
          <p className="text-xs text-stone-400">{t("Optional — used to match you with seekers looking for in-person support.")}</p>
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
              aria-pressed={field.value}
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
                <p className="text-sm font-medium text-stone-900">{t("Available for remote sessions")}</p>
                <p className="mt-0.5 text-xs text-stone-500">{t("I can work with clients via video call, voice call, or async messaging.")}</p>
              </div>
            </button>
          )}
        />
      )}

      {/* ── Step 4: Bio ──────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-1.5">
          <Label htmlFor="bio">{t("Bio")}</Label>
          <Textarea
            id="bio"
            rows={8}
            placeholder={t("Describe your background, your approach, and what working with you actually looks like. Be specific and genuine — seekers are looking for a real sense of who you are.")}
            autoFocus
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-red-500">{t(errors.bio.message ?? "")}</p>
          )}
          <div className="flex justify-between">
            <p className="text-xs text-stone-400">{t("Minimum 100 characters.")}</p>
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
                    {t(label)}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {items.map((m) => {
                      const selected = field.value.includes(m.name)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={selected}
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
                          {t(m.name)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {errors.modalities && (
                <p className="text-xs text-red-500">{t(errors.modalities.message ?? "")}</p>
              )}
            </div>
          )}
        />
      )}

      {/* ── Step 6: Years of experience ──────────────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-1.5">
          <Label htmlFor="years_experience">{t("Years of practice (self-reported)")}</Label>
          <Input
            id="years_experience"
            type="number"
            min={0}
            max={50}
            placeholder="0"
            autoFocus
            {...register('years_experience', { setValueAs: (value) => value === '' ? undefined : value })}
          />
          {errors.years_experience && (
            <p className="text-xs text-red-500">{t(errors.years_experience.message ?? "")}</p>
          )}
          <p className="text-xs text-stone-400">{t("Optional. May include personal practice. This is not a count of years working with clients; describe that experience separately in your bio.")}</p>
        </div>
      )}

      {/* ── Step 7: Training & certifications ───────────────────────────────── */}
      {step === 7 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lineage_or_training">{t("Training and lineage")}</Label>
            <Textarea
              id="lineage_or_training"
              rows={3}
              placeholder={t("List relevant training and lineage.")}
              autoFocus
              {...register('lineage_or_training')}
            />
            {errors.lineage_or_training && (
              <p className="text-xs text-red-500">{t(errors.lineage_or_training.message ?? "")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certifications">{t("Certifications")}</Label>
            <Input
              id="certifications"
              placeholder={t("List certifications, separated by commas.")}
              {...register('certifications')}
            />
            <p className="text-xs text-stone-400">{t("Optional. Comma-separated. These will be listed on your profile.")}</p>
          </div>
        </div>
      )}

      {/* ── Step 8: Safety practices ─────────────────────────────────────────── */}
      {step === 8 && (
        <div className="space-y-1.5">
          <Label htmlFor="safety_practices">{t("Your safety practices and screening process")}</Label>
          <Textarea
            id="safety_practices"
            rows={7}
            placeholder={t("Describe your intake process, how you screen for contraindications, which conditions or medications you do not work with, and how you handle crises or emergencies. Be specific — this builds trust with seekers and is reviewed by our team.")}
            autoFocus
            {...register('safety_practices')}
          />
          {errors.safety_practices && (
            <p className="text-xs text-red-500">{t(errors.safety_practices.message ?? "")}</p>
          )}
          <div className="flex justify-between">
            <p className="text-xs text-stone-400">{t("Minimum 50 characters. Displayed publicly on your profile.")}</p>
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 leading-relaxed">{t("Screening must fit the specific service and stay within your qualifications. A general checklist cannot establish whether a practice is appropriate for an individual. Refer medical, medication, and clinical eligibility questions to an appropriately qualified healthcare professional.")}<br />
            <br />{t("As a guide on this platform, you commit to appropriate screening for every client, respecting your scope, and declining work you cannot responsibly provide. Use an agreed confidential process for any necessary health intake; the platform contact form is for introductions.")}</div>

          <Controller
            name="contraindications_acknowledged"
            control={control}
            render={({ field }) => (
              <label
                htmlFor="contraindications_acknowledged"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all select-none',
                  field.value
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-stone-200'
                )}
              >
                <Checkbox
                  id="contraindications_acknowledged"
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? true : undefined)
                  }
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm font-medium text-stone-800">{t("I understand and commit to appropriate contraindication screening for every client.")}</span>
              </label>
            )}
          />
          {errors.contraindications_acknowledged && (
            <p className="text-xs text-red-500">
              {t(errors.contraindications_acknowledged.message ?? "")}
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
                    aria-pressed={field.value === value}
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
                      <p className="text-sm font-medium text-stone-900">{t(label)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{t(desc)}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          />
          <p className="text-xs text-stone-400">{t("All payments are for legal services only: preparation, integration, breathwork, coaching, and education.")}</p>
        </div>
      )}

      {/* ── Step 11: Rate ────────────────────────────────────────────────────── */}
      {step === 11 && (
        <div className="space-y-1.5">
          {donationBased ? (
            <>
              <Label htmlFor="minimum_donation">{t("Suggested minimum donation (USD)")}</Label>
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
                  {...register('minimum_donation', { setValueAs: (value) => value === '' ? undefined : value })}
                />
              </div>
              <p className="text-xs text-stone-400">{t("Optional. Leave blank if you prefer not to set a minimum.")}</p>
            </>
          ) : (
            <>
              <Label htmlFor="hourly_rate">{t("Session rate (USD)")}</Label>
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
                  {...register('hourly_rate', { setValueAs: (value) => value === '' ? undefined : value })}
                />
              </div>
              <p className="text-xs text-stone-400">{t("Optional. Leave blank if you prefer to discuss rates privately.")}</p>
            </>
          )}
          {donationBased && errors.minimum_donation && (
            <p role="alert" className="text-sm text-red-700">{t(errors.minimum_donation.message ?? "")}</p>
          )}
          {!donationBased && errors.hourly_rate && (
            <p role="alert" className="text-sm text-red-700">{t(errors.hourly_rate.message ?? "")}</p>
          )}
        </div>
      )}

      {step === 12 && (
        <Controller
          name="image_paths"
          control={control}
          render={({ field }) => (
            <ProfileMediaFields
              value={field.value ?? []}
              onChange={(paths) => {
                field.onChange(paths)
                void trigger('image_paths')
              }}
              onBusyChange={setUploading}
              error={errors.image_paths?.message}
              disabled={isSubmitting || uploading}
            />
          )}
        />
      )}

      {step === 13 && (
        <div className="space-y-5">
          <p className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-600">{t("These links will appear publicly on your approved profile. Visitors can open your messaging app and contact you directly. WhatsApp links and phone-based Signal links reveal your phone number. Conversations take place in that app, outside this site.")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp_url">{t("WhatsApp link (optional)")}</Label>
            <Input id="whatsapp_url" type="url" inputMode="url" autoCapitalize="none" spellCheck={false}
              placeholder="https://wa.me/14155552671" maxLength={320}
              aria-describedby="whatsapp-help whatsapp-error" aria-invalid={Boolean(errors.whatsapp_url)}
              {...register('whatsapp_url')} />
            <p id="whatsapp-help" className="text-xs text-stone-500">{t("Use https://wa.me/ followed by your country code and number, with no spaces or plus sign.")}</p>
            {errors.whatsapp_url && <p id="whatsapp-error" role="alert" className="text-sm text-red-700">{t(errors.whatsapp_url.message ?? "")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signal_url">{t("Signal link (optional)")}</Label>
            <Input id="signal_url" type="url" inputMode="url" autoCapitalize="none" spellCheck={false}
              placeholder={t("Paste your https://signal.me/ share link")} maxLength={320}
              aria-describedby="signal-help signal-error" aria-invalid={Boolean(errors.signal_url)}
              {...register('signal_url')} />
            <p id="signal-help" className="text-xs text-stone-500">{t("In Signal, open Settings → your profile → QR Code or Link, then copy your link. A username share link lets you avoid listing your phone number here.")}</p>
            {errors.signal_url && <p id="signal-error" role="alert" className="text-sm text-red-700">{t(errors.signal_url.message ?? "")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telegram_url">{t("Telegram link (optional)")}</Label>
            <Input id="telegram_url" type="url" inputMode="url" autoCapitalize="none" spellCheck={false}
              placeholder="https://t.me/your_username" maxLength={320}
              aria-describedby="telegram-help telegram-error" aria-invalid={Boolean(errors.telegram_url)}
              {...register('telegram_url')} />
            <p id="telegram-help" className="text-xs text-stone-500">{t("Add your personal account link, without an @ before the username. Use your own account, rather than a group or bot.")}</p>
            {errors.telegram_url && <p id="telegram-error" role="alert" className="text-sm text-red-700">{t(errors.telegram_url.message ?? "")}</p>}
          </div>
          <p className="text-xs text-stone-500">{t("Adding a link does not send a message. Leave all fields blank to use only the website contact form.")}</p>
        </div>
      )}

      {/* ── Step 14: Platform agreement ──────────────────────────────────────── */}
      {step === 14 && (
        <div className="space-y-4">
          <ul className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-5">
            {PLATFORM_RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                  {i + 1}
                </span>
                {t(rule, { appName: APP_NAME })}
              </li>
            ))}
          </ul>

          <Controller
            name="platform_agreement"
            control={control}
            render={({ field }) => (
              <label
                htmlFor="platform_agreement"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all select-none',
                  field.value
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-stone-200'
                )}
              >
                <Checkbox
                  id="platform_agreement"
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? true : undefined)
                  }
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm font-medium text-stone-800">{t("I have read and agree to all of the platform rules above.")}</span>
              </label>
            )}
          />
          {errors.platform_agreement && (
            <p className="text-xs text-red-500">{t(errors.platform_agreement.message ?? "")}</p>
          )}
        </div>
      )}

      {saveError && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {t(saveError)} <Link href="/facilitator" className="font-medium underline">{t("Open dashboard")}</Link>
        </p>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {existingProfile && step < TOTAL_STEPS && (
          <Button
            key="finish-editing"
            type="button"
            variant="outline"
            onClick={(event) => {
              event.preventDefault()
              goToStep(TOTAL_STEPS)
            }}
            disabled={uploading || isSubmitting}
            className="min-h-11 w-full"
          >{t("Finish editing")}</Button>
        )}
        {step > 1 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => goToStep(step - 1)}
            disabled={uploading || isSubmitting}
            className="min-h-11 text-stone-500"
          >{t("Back")}</Button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <Button
            key="continue"
            type="button"
            onClick={(event) => {
              // Prevent this click from submitting if a successful validation
              // renders the final submit button before the browser default runs.
              event.preventDefault()
              void advance()
            }}
            disabled={uploading || isSubmitting}
            className="min-h-11 bg-emerald-700 hover:bg-emerald-800"
          >{t("Continue")}</Button>
        ) : (
          <Button
            key="submit"
            type="submit"
            disabled={isSubmitting || uploading}
            className="min-h-11 bg-emerald-700 hover:bg-emerald-800"
          >
            {t(isSubmitting ? 'Submitting…' : existingProfile ? 'Submit changes for review' : 'Submit application')}
          </Button>
        )}
      </div>
    </form>
  )
}
