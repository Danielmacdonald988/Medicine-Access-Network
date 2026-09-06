/** Keep post-authentication destinations on this site, including after URL normalization. */
export function safeRedirectPath(value: string | null | undefined): string {
  const fallback = '/dashboard'
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback

  try {
    const decodedPath = decodeURIComponent(value.split(/[?#]/, 1)[0])
    if (decodedPath.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decodedPath) || /[\u0000-\u001f\u007f]/.test(value)) return fallback
    const base = 'https://redirect.invalid'
    const destination = new URL(value, base)
    if (destination.origin !== base || destination.pathname.startsWith('//')) return fallback
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return fallback
  }
}
