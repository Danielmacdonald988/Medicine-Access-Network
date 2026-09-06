export const MAX_PROFILE_IMAGES = 5
export const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024
export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const PROFILE_IMAGE_BUCKET = 'profile-images'
export const MAX_STORED_PROFILE_IMAGES = 20

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const imagePath = new RegExp(`^${uuid}/${uuid}\\.webp$`)

export function isProfileImagePath(value: unknown): value is string {
  return typeof value === 'string' && value.length === 78 && imagePath.test(value)
}

export function profileImageUrl(path: unknown): string | null {
  return isProfileImagePath(path) ? `/api/profile-images/${path}` : null
}

export const getProfileImageUrl = profileImageUrl

export function ownsProfileImage(path: unknown, userId: string): path is string {
  return isProfileImagePath(path) && path.startsWith(`${userId}/`)
}
