import { randomUUID } from 'node:crypto'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { hasCrossOriginSource, readSmallJson } from '@/lib/request-body'
import { normalizeProfileImage, readImageBytes } from '@/lib/normalize-profile-image'
import { MAX_STORED_PROFILE_IMAGES, ownsProfileImage, profileImageUrl, PROFILE_IMAGE_BUCKET, PROFILE_IMAGE_TYPES } from '@/lib/profile-media'

export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const reply = (body: object, status = 200) => Response.json(body, { status, headers })

async function uploadUser() {
  const client = await createServerSupabaseClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  const { data: account, error: roleError } = await client.from('users').select('role').eq('id', user.id).maybeSingle()
  return !roleError && account?.role === 'facilitator' ? user : null
}

export async function POST(request: Request) {
  if (hasCrossOriginSource(request)) return reply({ error: 'Upload photos from this website.' }, 403)
  try {
    const user = await uploadUser()
    if (!user) return reply({ error: 'Sign in as a facilitator to upload a photo.' }, 401)
    const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? ''
    if (!(PROFILE_IMAGE_TYPES as readonly string[]).includes(type)) return reply({ error: 'Choose a JPEG, PNG, or WebP image.' }, 415)
    let normalized: Buffer
    try { normalized = await normalizeProfileImage(await readImageBytes(request), type) }
    catch (error) {
      const oversized = error instanceof Error && error.message === 'size'
      return reply({ error: oversized ? 'Choose a photo smaller than 4 MB.' : 'This photo could not be opened. Choose a non-animated JPEG, PNG, or WebP image under 20 megapixels.' }, oversized ? 413 : 400)
    }
    const admin = createAdminSupabaseClient()
    const bucket = admin.storage.from(PROFILE_IMAGE_BUCKET)
    const { data: files, error: listError } = await bucket.list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } })
    if (listError || !files) throw new Error('storage')
    const { data: profile, error: profileError } = await admin.from('facilitator_profiles').select('image_paths').eq('user_id', user.id).maybeSingle()
    if (profileError) throw new Error('profile')
    const current = new Set<string>(profile?.image_paths ?? [])
    const oldUnused = files.filter(file => ownsProfileImage(`${user.id}/${file.name}`, user.id) && !current.has(`${user.id}/${file.name}`) && typeof file.created_at === 'string' && Date.parse(file.created_at) < Date.now() - 86_400_000)
    if (oldUnused.length) {
      const { error } = await bucket.remove(oldUnused.map(file => `${user.id}/${file.name}`))
      if (error) throw new Error('cleanup')
    }
    if (files.length - oldUnused.length >= MAX_STORED_PROFILE_IMAGES) return reply({ error: 'You have too many unused uploads. Remove unused photos or try again tomorrow.' }, 429)
    const path = `${user.id}/${randomUUID()}.webp`
    const { error } = await bucket.upload(path, normalized, { contentType: 'image/webp', upsert: false, cacheControl: '0' })
    if (error) throw new Error('upload')
    return reply({ path, url: profileImageUrl(path) }, 201)
  } catch {
    return reply({ error: 'Photo uploads are temporarily unavailable. Please try again.' }, 503)
  }
}

export async function DELETE(request: Request) {
  if (hasCrossOriginSource(request)) return reply({ error: 'Remove photos from this website.' }, 403)
  try {
    const user = await uploadUser()
    if (!user) return reply({ error: 'Sign in as a facilitator to remove a photo.' }, 401)
    const body = await readSmallJson(request)
    if (!body.ok) return reply({ error: body.error }, body.status)
    const path = body.data && typeof body.data === 'object' && 'path' in body.data ? body.data.path : null
    if (!ownsProfileImage(path, user.id)) return reply({ error: 'Photo not found.' }, 404)
    const admin = createAdminSupabaseClient()
    const { data: profile, error: profileError } = await admin.from('facilitator_profiles').select('id').eq('user_id', user.id).contains('image_paths', [path]).maybeSingle()
    if (profileError) throw new Error('profile')
    if (profile) return reply({ error: 'Save your profile without this photo before deleting it.' }, 409)
    const { error } = await admin.storage.from(PROFILE_IMAGE_BUCKET).remove([path])
    if (error) throw new Error('remove')
    return reply({ success: true })
  } catch { return reply({ error: 'This photo could not be removed. Please try again.' }, 503) }
}
