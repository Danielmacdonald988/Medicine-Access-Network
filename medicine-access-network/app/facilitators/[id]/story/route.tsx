import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { isProfileImagePath, PROFILE_IMAGE_BUCKET } from '@/lib/profile-media'
import { APP_NAME } from '@/lib/constants'
import { initialsFor, storyServices } from '@/lib/share-kit'

export const runtime = 'nodejs'

// Instagram story (1080x1920) built from a guide's public listing. Only
// approved, public profiles resolve (facilitator_public_profiles filters the
// rest), and the image is never cached publicly so an unpublished listing or
// withdrawn photo stops appearing immediately.
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }

async function photoDataUrl(path: unknown) {
  if (!isProfileImagePath(path)) return null
  try {
    const { data, error } = await createAdminSupabaseClient().storage.from(PROFILE_IMAGE_BUCKET).download(path)
    if (error || !data) return null
    // Satori cannot draw WebP, so hand it a square PNG.
    const png = await sharp(new Uint8Array(await data.arrayBuffer())).resize(520, 520, { fit: 'cover' }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: guide } = await supabase
    .from('facilitator_public_profiles')
    .select('display_name, location, remote_available, modalities, image_paths')
    .eq('id', id)
    .maybeSingle()
  if (!guide) return new Response(null, { status: 404, headers })

  const photo = await photoDataUrl(guide.image_paths?.[0])
  const services = storyServices(guide.modalities)
  const place = [guide.location?.split(';')[0]?.trim(), guide.remote_available ? 'Online sessions' : null].filter(Boolean).join(' · ')

  const image = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '140px 90px 150px', background: 'linear-gradient(170deg, #064e3b 0%, #065f46 55%, #0f766e 100%)', color: '#f5f5f4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width={64} height={64} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#f5f5f4" />
            <path d="M12 5L18.06 15.5L5.94 15.5Z" fill="#065f46" />
          </svg>
          <div style={{ fontSize: 38, fontWeight: 600 }}>{APP_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={460} height={460} alt="" style={{ borderRadius: 9999, border: '10px solid #f5f5f4', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 460, height: 460, borderRadius: 9999, background: '#f5f5f4', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 170, fontWeight: 700 }}>{initialsFor(guide.display_name)}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ fontSize: 86, fontWeight: 700, textAlign: 'center', lineHeight: 1.05, letterSpacing: -1.5 }}>{guide.display_name}</div>
            {place && <div style={{ fontSize: 38, color: '#d6d3d1', textAlign: 'center' }}>{place}</div>}
          </div>
          {services.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, maxWidth: 900 }}>
              {services.map((service) => (
                <div key={service} style={{ display: 'flex', padding: '16px 30px', borderRadius: 9999, background: 'rgba(245,245,244,0.14)', border: '2px solid rgba(167,243,208,0.5)', fontSize: 34 }}>{service}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 600, textAlign: 'center' }}>Find me on The Facilitator Network</div>
          <div style={{ fontSize: 36, color: '#a7f3d0' }}>thefacilitatornetwork.com</div>
          <div style={{ fontSize: 26, color: '#d6d3d1', marginTop: 10 }}>Legal support services only · Not medical advice</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
  for (const [key, value] of Object.entries(headers)) image.headers.set(key, value)
  image.headers.set('Content-Disposition', 'inline; filename="facilitator-network-story.png"')
  return image
}
