import { createServerClient } from '@supabase/ssr'

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  let cookieStore;
  try {
    // Dynamically import next/headers only when execution happens at runtime.
    // This stops Next.js from throwing an error during the static compilation phase.
    const { cookies } = await import('next/headers')
    cookieStore = await cookies()
  } catch (e) {
    // Safe fallback client for static layout/build rendering
    return createServerClient(url, anonKey, { cookies: { getAll() { return [] }, setAll() {} } })
  }

  return createServerClient(
    url,
    anonKey,
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
            // Safe fallback for read-only server component contexts
          }
        },
      },
    }
  )
}