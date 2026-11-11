import { createProfileThumbnail } from '@/lib/normalize-profile-image'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { isProfileImagePath, ownsProfileImage, PROFILE_IMAGE_BUCKET } from '@/lib/profile-media'

export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" }
const missing = () => new Response(null, { status: 404, headers })

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  if (!isProfileImagePath(path)) return missing()
  const variants = new URL(request.url).searchParams.getAll('variant')
  if (variants.length > 1 || (variants.length === 1 && variants[0] !== 'thumbnail')) return missing()
  const thumbnail = variants[0] === 'thumbnail'
  try {
    const client = await createServerSupabaseClient()
    const { data: { user } } = await client.auth.getUser()
    let allowed = Boolean(user && ownsProfileImage(path, user.id))
    if (!allowed) {
      const { data: profile, error } = await client.from('facilitator_public_profiles').select('id').contains('image_paths', [path]).limit(1).maybeSingle()
      if (error) throw new Error('lookup')
      allowed = Boolean(profile)
    }
    if (!allowed && user) {
      const { data: account, error: roleError } = await client.from('users').select('role').eq('id', user.id).maybeSingle()
      if (roleError) throw new Error('role')
      if (account?.role === 'admin') {
        const { data: profile, error } = await client.from('facilitator_profiles').select('id').contains('image_paths', [path]).limit(1).maybeSingle()
        if (error) throw new Error('lookup')
        allowed = Boolean(profile)
      }
    }
    if (!allowed) return missing()
    const { data, error } = await createAdminSupabaseClient().storage.from(PROFILE_IMAGE_BUCKET).download(path)
    if (error || !data) return missing()
    // Transform only after the exact same publication/owner/admin authorization.
    // Never persist or publicly cache derivatives: withdrawals must take effect.
    const output = thumbnail ? new Uint8Array(await createProfileThumbnail(new Uint8Array(await data.arrayBuffer()))) : data
    return new Response(output, { headers: { ...headers, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="profile-photo.webp"' } })
  } catch {
    return new Response(null, { status: 503, headers: { ...headers, 'Retry-After': '30' } })
  }
}
