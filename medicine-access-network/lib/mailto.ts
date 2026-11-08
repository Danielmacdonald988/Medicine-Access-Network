/** RFC 6068 uses percent encoding, not HTML form encoding (+ for spaces). */
export function mailtoHref(address: string, fields?: { subject: string; body: string }): string {
  if (!fields) return `mailto:${address}`
  const body = fields.body.replace(/\r\n|\r|\n/g, '\r\n')
  return `mailto:${address}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(body)}`
}
