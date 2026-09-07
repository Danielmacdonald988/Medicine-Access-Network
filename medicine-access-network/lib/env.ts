import { z } from 'zod'

const productionEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((value) => value.startsWith('https://')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
  }),
  NEXT_PUBLIC_PAYMENTS_ENABLED: z.literal('false').optional(),
})

/** Production must fail its build instead of silently deploying placeholder credentials. */
export function validateEnv() {
  if (process.env.VERCEL_ENV !== 'production') return
  const result = productionEnvSchema.safeParse(process.env)
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
    throw new Error(`Invalid production configuration: ${fields.join(', ')}. Payments must remain disabled for this release.`)
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn('[configuration] Email notifications are not configured; requests and applications remain available in their dashboards.')
  } else if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
    console.warn('[configuration] Admin application email alerts are not configured; applications remain available in the admin dashboard.')
  }
}
