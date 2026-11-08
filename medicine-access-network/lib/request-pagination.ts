export const REQUEST_PAGE_SIZE = 40

/** Untrusted URL input cannot request negative, fractional or unbounded offsets. */
export function parseRequestPage(value: string | string[] | undefined): number {
  if (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value)) return 1
  return Number(value)
}
