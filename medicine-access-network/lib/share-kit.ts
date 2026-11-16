import { profileServices, SITE_URL } from './constants'

// A guide's share kit: a story image built from their public listing and a
// "Listed on" badge for their own website. Everything shown comes from the
// public projection the profile page already shows; no ratings, counts,
// verification claims or outcome language.

export const BADGE_PATH = '/badges/listed-on-tfn.svg'
export const BADGE_WIDTH = 240
export const BADGE_HEIGHT = 60

export function profileUrl(id: string) {
  return `${SITE_URL}/facilitators/${id}`
}

export function storyImagePath(id: string) {
  return `/facilitators/${id}/story`
}

export function storyServices(modalities: readonly string[] | null | undefined, max = 3) {
  return profileServices(modalities ?? []).slice(0, max)
}

export function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function badgeEmbedCode(id: string) {
  return `<a href="${profileUrl(id)}" target="_blank" rel="noopener"><img src="${SITE_URL}${BADGE_PATH}" alt="Listed on The Facilitator Network" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}"></a>`
}

export function suggestedCaption(id: string) {
  return `I'm now listed on The Facilitator Network, a free directory for preparation and integration support. You can see my services and reach out without creating an account: ${profileUrl(id)}`
}
