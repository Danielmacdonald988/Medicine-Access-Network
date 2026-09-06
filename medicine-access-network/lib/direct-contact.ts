import { z } from 'zod'

export type DirectContactPlatform = 'whatsapp' | 'signal' | 'telegram'
export const DIRECT_CONTACT_URL_MAX_LENGTH = 320

// These names invoke Telegram features instead of opening a person's username.
// Keep this list aligned with the database constraint in migration 0005.
export const TELEGRAM_RESERVED_NAMES = [
  'addemoji', 'addlist', 'addstickers', 'addstyle', 'addtheme', 'auction',
  'auth', 'boost', 'call', 'confirmphone', 'contact', 'giftcode', 'invoice',
  'joinchat', 'login', 'm', 'nft', 'proxy', 'setlanguage', 'share', 'socks',
  'web', 'a', 'k', 'z',
] as const

const TELEGRAM_RESERVED = new Set<string>(TELEGRAM_RESERVED_NAMES)
const PLATFORM_LABELS: Record<DirectContactPlatform, string> = {
  whatsapp: 'WhatsApp', signal: 'Signal', telegram: 'Telegram',
}

export const DIRECT_CONTACT_URL_HELP: Record<DirectContactPlatform, string> = {
  whatsapp: 'Use https://wa.me/ followed by your full international phone number, including country code, without +, spaces, or punctuation.',
  signal: 'Copy your full https://signal.me/#eu/ link from Signal: Settings → your profile → QR Code or Link. A https://signal.me/#p/+ link with your international phone number also works.',
  telegram: 'Use https://t.me/ followed by your personal username (5–32 letters, numbers, or underscores, starting with a letter). Paste your own contact link, not a group invite.',
}

/**
 * Accept only direct person-contact routes on the exact service hosts.
 * Matching the original text avoids URL parser normalization of backslashes,
 * dot segments, encoded paths, credentials, ports, or hidden control characters.
 * This validates the route, not ownership or whether an account still exists.
 */
export function normalizeDirectContactUrl(platform: DirectContactPlatform, value: unknown): string | null {
  if (typeof value !== 'string' || value.length > DIRECT_CONTACT_URL_MAX_LENGTH) return null
  const input = value.trim()
  const origin = /^https:\/\/([^/]+)(\/.*)$/i.exec(input)
  if (!origin) return null
  const host = origin[1].toLowerCase()
  const route = origin[2]

  if (platform === 'whatsapp' && host === 'wa.me' && /^\/[1-9][0-9]{6,14}$/.test(route)) {
    return `https://wa.me${route}`
  }
  // Signal's username share link contains 32 bytes of entropy + a 16-byte UUID,
  // encoded as 64 URL-safe base64 characters, without padding.
  if (platform === 'signal' && host === 'signal.me' && /^\/#(?:eu\/[A-Za-z0-9_-]{64}|p\/\+[1-9][0-9]{6,14})$/.test(route)) {
    return `https://signal.me${route}`
  }
  if (platform === 'telegram' && host === 't.me' && /^\/[A-Za-z][A-Za-z0-9_]{4,31}$/.test(route)) {
    const name = route.slice(1).toLowerCase()
    if (TELEGRAM_RESERVED.has(name)) return null
    return `https://t.me${route}`
  }
  return null
}

export function directContactUrlSchema(platform: DirectContactPlatform) {
  return z.union([z.string().max(DIRECT_CONTACT_URL_MAX_LENGTH, DIRECT_CONTACT_URL_HELP[platform]), z.null(), z.undefined()]).transform((value, context) => {
    if (value == null || value.trim() === '') return null
    const normalized = normalizeDirectContactUrl(platform, value)
    if (normalized === null) {
      context.addIssue({ code: 'custom', message: DIRECT_CONTACT_URL_HELP[platform] })
      return z.NEVER
    }
    return normalized
  })
}

export type DirectContactProfile = {
  whatsapp_url?: string | null
  signal_url?: string | null
  telegram_url?: string | null
}

export function getDirectContactLinks(profile: DirectContactProfile): { platform: DirectContactPlatform; label: string; href: string }[] {
  const platforms: DirectContactPlatform[] = ['whatsapp', 'signal', 'telegram']
  return platforms.flatMap((platform) => {
    const href = normalizeDirectContactUrl(platform, profile[`${platform}_url`])
    return href ? [{ platform, label: PLATFORM_LABELS[platform], href }] : []
  })
}
