// Server-only environment validation.
// Imported once at startup — throws immediately if a required variable is missing.
// This surfaces misconfiguration during boot, not mid-request.
import 'server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  // Supabase — required for the app to function at all
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  // Optional for MVP — only needed if createServiceRoleClient is called (e.g., admin batch ops)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // App URL — optional in dev, required in production
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Stripe — optional until payments are enabled
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_PAYMENTS_ENABLED: z.enum(['true', 'false']).optional().default('false'),
})

function validateEnv() {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    throw new Error(
      `\n\n❌ Environment variable validation failed:\n${missing}\n\n` +
        `Copy .env.local.example to .env.local and fill in the required values.\n`
    )
  }

  // Extra guard: if payments are enabled, Stripe keys must be present.
  if (result.data.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true') {
    if (!result.data.STRIPE_SECRET_KEY?.startsWith('sk_')) {
      throw new Error(
        'NEXT_PUBLIC_PAYMENTS_ENABLED=true but STRIPE_SECRET_KEY is missing or invalid. ' +
          'Provide a valid Stripe secret key or set NEXT_PUBLIC_PAYMENTS_ENABLED=false.'
      )
    }
    if (!result.data.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
      throw new Error(
        'NEXT_PUBLIC_PAYMENTS_ENABLED=true but STRIPE_WEBHOOK_SECRET is missing. ' +
          'Provide the webhook signing secret from the Stripe dashboard.'
      )
    }
  }

  return result.data
}

// Validate once on module load.
export const env = validateEnv()

// Convenience booleans derived from env.
export const PAYMENTS_ACTIVE = env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
export const APP_URL = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
