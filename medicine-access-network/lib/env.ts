import { z } from 'zod'

// Define the schema just like before
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYMENTS_ENABLED: z.enum(['true', 'false']).optional().default('false'),
})

export function validateEnv() {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => ` • ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    // Print a safe warning to the Vercel logs instead of throwing a hard error
    console.warn(
      `⚠️ WARNING: Environment variable validation failed during compilation:\n${missing}\n` +
      `Using fallback placeholder keys to complete the build safely.`
    )
    
    // Return standard fallback data so the application doesn't read undefined values during optimization
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      NEXT_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || 'false'
    }
  }

  // Extra guard: If payments are enabled, check Stripe keys, but only issue warnings during builds
  if (result.data.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true') {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
      console.warn('⚠️ Stripe setup warning: STRIPE_SECRET_KEY is missing or invalid.')
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
      console.warn('⚠️ Stripe setup warning: STRIPE_WEBHOOK_SECRET is missing or invalid.')
    }
  }

  return result.data
}