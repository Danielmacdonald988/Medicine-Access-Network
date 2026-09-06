import { MODALITIES } from './constants'

export const GENERAL_INTRODUCTION = 'Not sure — general introduction'

/** Offer only catalog practices actually listed on this profile. */
export function profileSupportOptions(modalities: readonly string[]) {
  const listed = new Set(modalities.map((value) => value.trim().toLowerCase()))
  return [
    ...MODALITIES.filter(
      ({ id, name }) => listed.has(id) || listed.has(name.toLowerCase()),
    ).map(({ name }) => name),
    GENERAL_INTRODUCTION,
  ]
}

export function profileFormatOptions(
  remoteAvailable: boolean,
  location?: string | null,
) {
  return [
    { value: 'async' as const, label: 'Not sure — discuss by email' },
    ...(remoteAvailable
      ? [
          { value: 'video' as const, label: 'Ask about a video call' },
          { value: 'voice' as const, label: 'Ask about a voice call' },
        ]
      : []),
    ...(location?.trim()
      ? [{ value: 'in_person' as const, label: 'Ask about meeting in person' }]
      : []),
  ]
}
