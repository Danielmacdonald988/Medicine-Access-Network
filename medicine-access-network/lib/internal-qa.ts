/** Explicit, tab-local QA exclusion. This is not authentication or user tracking. */
export function isInternalQa(): boolean {
  if (typeof window === 'undefined') return false
  const mode = new URLSearchParams(window.location.search).get('tfn_qa')
  try {
    if (mode === '1') window.sessionStorage.setItem('tfn-internal-qa', '1')
    if (mode === '0') window.sessionStorage.removeItem('tfn-internal-qa')
    if (mode === '1' || mode === '0') return mode === '1'
    return window.sessionStorage.getItem('tfn-internal-qa') === '1'
  } catch {
    // An explicit QA URL still excludes this page when storage is blocked.
    return mode === '1'
  }
}
