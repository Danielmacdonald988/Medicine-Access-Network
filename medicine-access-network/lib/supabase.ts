import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ------ Browser client (use in Client Components) ------------------
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient(url, anonKey)
}

// ------ Server client (use in Server Components, Route Handlers, Server Actions) --
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Safely intercept execution if next/headers cookies aren't ready during global compilation
  let cookieStore;
  try {
    cookieStore = await cookies()
  } catch (e) {
    // Return a basic client configuration if evaluated outside a request context
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