import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/** Keep the newly verified session on the exact response sent to the browser. */
export function createCallbackSupabaseClient(request: Request) {
  const cookieJar = new NextRequest(request).cookies
  const pending = new Map<string, { name: string; value: string; options: CookieOptions }>()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll: () => cookieJar.getAll(),
        setAll: (cookies) => {
          for (const cookie of cookies) {
            cookieJar.set(cookie.name, cookie.value)
            pending.set(cookie.name, cookie)
          }
        },
      },
    },
  )
  function redirect(path: string) {
    const response = NextResponse.redirect(new URL(path, request.url))
    for (const cookie of pending.values()) response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  }
  return { supabase, redirect }
}
