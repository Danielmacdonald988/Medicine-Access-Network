import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width={180} height={180} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#065f46" />
        <path d="M12 5L18.06 15.5L5.94 15.5Z" fill="#f5f5f4" />
      </svg>
    ),
    { ...size }
  )
}
