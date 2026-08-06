import { z } from 'zod'

// ─── Auth ────────────────────────────────────────────────────────────────────

// Seekers have no accounts — signup only ever creates a facilitator. No
// role field: there's nothing to choose anymore. (See lib/auth.ts and
// app/auth/callback/route.ts, which still tolerate a legacy 'seeker' role
// value on old rows — this schema is only about what NEW signups can be.)
export const signUpSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── Facilitator Onboarding ──────────────────────────────────────────────────

export const facilitatorOnboardingSchema = z.object({
  // Steps 1–3
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  location: z.string().optional(),
  remote_available: z.boolean().default(true),
  // Step 4
  bio: z
    .string()
    .min(100, 'Bio must be at least 100 characters')
    .max(2000, 'Bio must be under 2000 characters'),
  // Step 5
  modalities: z.array(z.string()).min(1, 'Select at least one modality'),
  // Step 6
  years_experience: z.coerce.number().min(0).max(50).optional(),
  // Step 7
  lineage_or_training: z.string().max(500).optional(),
  certifications: z.string().optional(), // comma-separated, split on submit
  // Step 8
  safety_practices: z
    .string()
    .min(50, 'Please describe your safety practices in at least 50 characters')
    .max(1000),
  // Step 9
  contraindications_acknowledged: z.literal(true, {
    message: 'You must acknowledge contraindication awareness',
  }),
  // Steps 10–11
  donation_based: z.boolean().default(false),
  minimum_donation: z.coerce.number().min(0).optional(),
  hourly_rate: z.coerce.number().min(0).optional(),
  // Step 12 — stripped before DB write
  platform_agreement: z.literal(true, {
    message: 'You must agree to the platform rules to apply',
  }),
})

// ─── Contact Request (stateless — no seeker account) ──────────────────────────
// Replaces the old account-gated bookingRequestSchema. Seekers have no
// accounts, so name/email travel with the request itself — they're the only
// way the facilitator can identify and reply to whoever contacted them.

// Base schema — what the API accepts and stores in the DB
export const contactRequestSchema = z.object({
  facilitator_profile_id: z.string().uuid(),
  seeker_name: z.string().min(2, 'Please enter your name').max(200),
  seeker_email: z.string().email('Please enter a valid email address'),
  requested_service: z.string().min(1, 'Please select a type of support'),
  message: z
    .string()
    .min(20, 'Please share a bit more — at least 20 characters')
    .max(1000, 'Keep it under 1000 characters'),
  preferred_format: z.enum(['voice', 'video', 'in_person', 'async']),
  preferred_time_window: z.string().max(200).optional(),
})

// Form schema — extends the base with a UI-only safety acknowledgement.
// Deliberately does NOT include the honeypot field — that's checked as a
// raw, unvalidated string server-side (see app/api/contact-requests/route.ts)
// so a bot filling it never sees a validation error hinting it's a trap.
export const contactRequestFormSchema = contactRequestSchema.extend({
  ack_safety: z.literal(true, {
    message: 'Please confirm before sending your message',
  }),
})

// ─── Review ──────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  text: z
    .string()
    .min(20, 'Review must be at least 20 characters')
    .max(1000, 'Review must be under 1000 characters'),
  safety_rating: z.number().min(1).max(5),
  integration_rating: z.number().min(1).max(5),
})

// ─── Admin Verification ──────────────────────────────────────────────────────

export const verificationNoteSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  note: z.string().max(1000).optional(),
})

// Inferred types
export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type FacilitatorOnboardingInput = z.infer<typeof facilitatorOnboardingSchema>
export type ContactRequestInput = z.infer<typeof contactRequestSchema>
export type ContactRequestFormInput = z.infer<typeof contactRequestFormSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type VerificationNoteInput = z.infer<typeof verificationNoteSchema>
