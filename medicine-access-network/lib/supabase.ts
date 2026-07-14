import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Fallback keys to prevent Vercel build compilation crashes if variables aren't set yet
const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const fallbackAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// The Database generic is intentionally omitted here.
// Run `npx supabase gen types typescript --local > lib/database.types.ts`
// after connecting your Supabase project, then add `<Database>` back.

// ------ Browser client (use in Client Components) ------------------

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackAnonKey
  )
}

// ------ Server client (use in Server Components, Route Handlers, Server Actions) --

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The setAll method was called from a Server Component — cookies are read-only
          }
        },
      },
    }
  )
}