import { z } from 'zod'
export const SOCIAL_FIELDS = [
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://www.instagram.com/yourname/' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://www.facebook.com/yourname' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/yourname/' },
  { key: 'website_url', label: 'Website / other social link', placeholder: 'https://example.com' },
] as const
export type SocialKey = typeof SOCIAL_FIELDS[number]['key']
export type SocialProfile = Partial<Record<SocialKey, string | null>>
const hosts: Partial<Record<SocialKey, string[]>> = {
  instagram_url: ['instagram.com', 'www.instagram.com'],
  facebook_url: ['facebook.com', 'www.facebook.com'],
  linkedin_url: ['linkedin.com', 'www.linkedin.com'],
}
export function normalizeSocialUrl(key: SocialKey, value: unknown): string | null {
  if (typeof value !== 'string') return null
  const input = value.trim()
  if (!input || input.length > 500 || /[\s\\]/.test(input)) return null
  try {
    const url = new URL(input)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.')) return null
    if (hosts[key] && (!hosts[key]!.includes(url.hostname) || url.pathname === '/')) return null
    return url.href
  } catch { return null }
}
export function socialUrlSchema(key: SocialKey) {
  return z.string().max(500).nullish().transform((value, ctx) => {
    if (value === undefined) return undefined
    if (!value?.trim()) return null
    const url = normalizeSocialUrl(key, value)
    if (!url) { ctx.addIssue({code:'custom', message:'Enter a valid HTTPS profile link.'}); return z.NEVER }
    return url
  })
}
export function getSocialLinks(profile: SocialProfile) {
  return SOCIAL_FIELDS.flatMap(field => {
    const href = normalizeSocialUrl(field.key, profile[field.key])
    return href ? [{...field, href}] : []
  })
}
