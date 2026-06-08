import { z } from 'zod'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signUpSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['seeker', 'facilitator']),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── Seeker Onboarding ───────────────────────────────────────────────────────

export const seekerOnboardingSchema = z.object({
  // Step 1
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  // Step 2
  location: z.string().optional(),
  remote_preference: z.boolean().default(false),
  // Step 3
  experience_level: z.enum(['curious', 'beginner', 'experienced']),
  // Step 4 — stored in preferred_modalities text[]
  preferred_modalities: z.array(z.string()).min(1, 'Please select at least one type of support'),
  // Step 5
  intention: z
    .string()
    .min(10, 'Please share a bit more — at least 10 characters')
    .max(1000, 'Keep it under 1000 characters'),
  // Always private by default
  privacy_preference: z.enum(['public', 'private']).default('private'),
  // Step 6 — acknowledgements (stripped before DB write)
  ack_not_medical: z.literal(true, { message: 'Please confirm this statement' }),
  ack_no_substances: z.literal(true, { message: 'Please confirm this statement' }),
  ack_not_emergency: z.literal(true, { message: 'Please confirm this statement' }),
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

// ─── Booking Request ─────────────────────────────────────────────────────────

// Base schema — what the API accepts and stores in the DB
export const bookingRequestSchema = z.object({
  requested_service: z.string().min(1, 'Please select a type of support'),
  message: z
    .string()
    .min(20, 'Please share a bit more — at least 20 characters')
    .max(1000, 'Keep it under 1000 characters'),
  preferred_format: z.enum(['voice', 'video', 'in_person', 'async']),
  preferred_time_window: z.string().max(200).optional(),
})

// Form schema — extends the base with a UI-only safety acknowledgement
export const bookingRequestFormSchema = bookingRequestSchema.extend({
  ack_safety: z.literal(true, {
    message: 'Please confirm before sending your request',
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
export type SeekerOnboardingInput = z.infer<typeof seekerOnboardingSchema>
export type FacilitatorOnboardingInput = z.infer<typeof facilitatorOnboardingSchema>
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>
export type BookingRequestFormInput = z.infer<typeof bookingRequestFormSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type VerificationNoteInput = z.infer<typeof verificationNoteSchema>
