import { ImageResponse } from 'next/og'
import { APP_NAME } from '@/lib/constants'

// Default link-preview card for every public page that does not supply its
// own image (guide profiles with a photo keep using that photo). Static
// brand copy only: no guide names, counts, claims or request-time data, so
// the image can be generated once at build time.
export const alt = `${APP_NAME} — compare guides for preparation and integration support`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0f766e 100%)',
          color: '#f5f5f4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width={72} height={72} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#f5f5f4" />
            <path d="M12 5L18.06 15.5L5.94 15.5Z" fill="#065f46" />
          </svg>
          <div style={{ fontSize: 36, fontWeight: 600 }}>{APP_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>
            Find a guide for preparation and integration support
          </div>
          <div style={{ fontSize: 32, color: '#d6d3d1', lineHeight: 1.35 }}>
            Compare profiles, read the safety library, and start a conversation. No account needed to browse.
          </div>
        </div>
        <div style={{ fontSize: 24, color: '#a7f3d0' }}>
          Legal support services only · Not medical advice
        </div>
      </div>
    ),
    { ...size },
  )
}
