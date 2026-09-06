type BodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 413 | 415; error: string }

const MAX_BODY_BYTES = 16_384

export function hasCrossOriginSource(request: Request): boolean {
  const origin = request.headers.get('origin')
  return request.headers.get('sec-fetch-site') === 'cross-site'
    || (origin !== null && origin !== new URL(request.url).origin)
}

async function readBoundedBody(request: Request): Promise<BodyResult<ArrayBuffer>> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request is too large.' }
  }

  const reader = request.body?.getReader()
  if (!reader) return { ok: false, status: 400, error: 'Invalid request body.' }
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      // Check the bytes actually received; Content-Length may be absent or wrong.
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {})
        return { ok: false, status: 413, error: 'Request is too large.' }
      }
      chunks.push(value)
    }
    const buffer = new ArrayBuffer(size)
    const bytes = new Uint8Array(buffer)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return { ok: true, data: buffer }
  } catch {
    return { ok: false, status: 400, error: 'Invalid request body.' }
  } finally {
    reader.releaseLock()
  }
}

export async function readSmallJson(request: Request): Promise<BodyResult<unknown>> {
  const mediaType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  // JSON requires a browser preflight across origins. Accepting text/plain here
  // would let an unrelated site submit an inquiry through a normal HTML form.
  if (mediaType !== 'application/json') {
    return { ok: false, status: 415, error: 'Use application/json for this request.' }
  }
  const body = await readBoundedBody(request)
  if (!body.ok) return body
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body.data)
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON request.' }
  }
}

export async function readSmallFormData(request: Request): Promise<BodyResult<FormData>> {
  const contentType = request.headers.get('content-type') ?? ''
  const mediaType = contentType.split(';')[0].trim().toLowerCase()
  if (!['application/x-www-form-urlencoded', 'multipart/form-data'].includes(mediaType)) {
    return { ok: false, status: 415, error: 'Use a form for this request.' }
  }
  const body = await readBoundedBody(request)
  if (!body.ok) return body
  try {
    const form = await new Response(body.data, {
      headers: { 'Content-Type': contentType },
    }).formData()
    return { ok: true, data: form }
  } catch {
    return { ok: false, status: 400, error: 'Invalid form request.' }
  }
}
