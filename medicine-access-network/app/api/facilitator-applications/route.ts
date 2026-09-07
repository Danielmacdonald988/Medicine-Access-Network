import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { facilitatorOnboardingSchema } from '@/lib/validations'
import { hasCrossOriginSource, readSmallJson } from '@/lib/request-body'
import { ownsProfileImage } from '@/lib/profile-media'
import { dispatchAdminApplicationNotifications } from '@/lib/admin-notifications'

export const runtime = 'nodejs'
export const maxDuration = 60

const submissionSchema = z.object({
  profileId: z.string().uuid().optional(),
  application: facilitatorOnboardingSchema,
}).strict()

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export async function POST(request: Request) {
  if (hasCrossOriginSource(request)) {
    return json({ error: 'This request must come from this site.' }, 403)
  }

  try {
    // Use the signed-in client's permissions for the save. Database policies and
    // photo ownership/storage checks must apply to this write.
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return json({ error: 'Your sign-in has expired. Sign in again before submitting your profile.' }, 401)
    }
    const { data: account, error: accountError } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (accountError) return json({ error: 'Your account could not be checked. Please try again.' }, 503)
    if (account?.role !== 'facilitator') return json({ error: 'A guide account is required to submit an application.' }, 403)

    const body = await readSmallJson(request)
    if (!body.ok) return json({ error: body.error }, body.status)
    const parsed = submissionSchema.safeParse(body.data)
    if (!parsed.success) {
      return json({ error: 'Review your application fields, required photo, and platform agreement before submitting.' }, 400)
    }
    const { profileId, application: data } = parsed.data
    if (data.image_paths.some((path) => !ownsProfileImage(path, user.id))) {
      return json({ error: 'Use photos uploaded through your own account.' }, 400)
    }

    const profileData = {
      user_id: user.id,
      display_name: data.display_name,
      bio: data.bio,
      location: data.location || null,
      remote_available: data.remote_available,
      modalities: data.modalities,
      years_experience: data.years_experience ?? null,
      lineage_or_training: data.lineage_or_training || null,
      certifications: data.certifications
        ? data.certifications.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [],
      safety_practices: data.safety_practices,
      contraindications_acknowledged: data.contraindications_acknowledged,
      donation_based: data.donation_based,
      minimum_donation: data.minimum_donation ?? null,
      hourly_rate: data.hourly_rate ?? null,
      image_paths: data.image_paths,
      whatsapp_url: data.whatsapp_url || null,
      signal_url: data.signal_url || null,
      telegram_url: data.telegram_url || null,
      verification_status: 'pending',
      visibility: 'hidden',
    }
    // A new application never overwrites an existing one. An edit requires both
    // the explicit profile ID and the authenticated owner, even before RLS.
    const query = profileId
      ? supabase.from('facilitator_profiles').update(profileData)
          .eq('id', profileId).eq('user_id', user.id)
      : supabase.from('facilitator_profiles').insert(profileData)
    const { data: saved, error } = await query.select('id').single()
    if (error || !saved) {
      if (error?.code === '23505') {
        return json({ error: 'An application already exists for this account. Open your dashboard to edit it.' }, 409)
      }
      if (error?.code === '23514') {
        return json({ error: 'Your profile could not be saved. Check your photos and application fields, then try again.' }, 400)
      }
      return json({ error: 'Your profile could not be saved. Your entries are still here; please try again.' }, 500)
    }

    // The database saves the notification queue entry in the same transaction as
    // the application. Email availability must never undo a successful save.
    after(async () => {
      try {
        await dispatchAdminApplicationNotifications({ profileId: saved.id })
      } catch {
        console.error('[applications] admin notification remains queued')
      }
    })
    return json({ success: true, profileId: saved.id }, profileId ? 200 : 201)
  } catch {
    console.error('[applications] submission service unavailable')
    return json({ error: 'Your profile could not be saved. Your entries are still here; please try again.' }, 500)
  }
}
