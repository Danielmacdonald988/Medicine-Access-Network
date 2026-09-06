import type { FacilitatorPublicProfile } from './types'

export const SAVED_GUIDES_LIMIT = 3
export const SAVED_GUIDES_KEY = 'facilitator-network:saved-guides:v1'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SavedGuideProfile = Pick<FacilitatorPublicProfile,
  'id' | 'display_name' | 'bio' | 'location' | 'remote_available' | 'modalities' |
  'donation_based' | 'minimum_donation' | 'hourly_rate' | 'years_experience' |
  'lineage_or_training' | 'certifications'>

export const SAVED_GUIDE_COLUMNS = 'id, display_name, bio, location, remote_available, modalities, donation_based, minimum_donation, hourly_rate, years_experience, lineage_or_training, certifications'

// Reject malformed or oversized API lists before starting a database request.
export function parseSavedGuideQuery(values: string[]): string[] | null {
  if (values.length > SAVED_GUIDES_LIMIT || values.some((value) => value.length > 110)) return null
  const ids = values.flatMap((value) => value.split(','))
  if (!ids.length || ids.length > SAVED_GUIDES_LIMIT || ids.some((id) => !UUID.test(id))) return null
  return [...new Set(ids.map((id) => id.toLowerCase()))]
}

// Browser storage is untrusted. Never recover names, messages, or other objects.
export function readSavedGuideIds(raw: string | null): string[] {
  if (!raw || raw.length > 200) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > SAVED_GUIDES_LIMIT || value.some((id) => typeof id !== 'string' || !UUID.test(id))) return []
    return [...new Set((value as string[]).map((id) => id.toLowerCase()))]
  } catch {
    return []
  }
}

export function toggleSavedGuide(ids: string[], profileId: string): { ids: string[]; error?: string } {
  const normalized = profileId.toLowerCase()
  if (!UUID.test(normalized)) return { ids, error: 'This profile could not be saved.' }
  if (ids.includes(normalized)) return { ids: ids.filter((id) => id !== normalized) }
  if (ids.length >= SAVED_GUIDES_LIMIT) return { ids, error: 'You can compare up to 3 guides. Remove one from Saved guides first.' }
  return { ids: [...ids, normalized] }
}

export function savedGuideFee(profile: SavedGuideProfile): string {
  if (profile.donation_based) {
    return typeof profile.minimum_donation === 'number'
      ? `Suggested donation from $${profile.minimum_donation} USD`
      : 'Donation-based; ask about the amount'
  }
  return typeof profile.hourly_rate === 'number'
    ? `$${profile.hourly_rate} USD per session`
    : 'Ask about fees'
}
