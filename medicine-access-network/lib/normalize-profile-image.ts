import sharp from 'sharp'
import { MAX_PROFILE_IMAGE_BYTES, PROFILE_IMAGE_TYPES } from './profile-media'

export async function readImageBytes(request: Request): Promise<Uint8Array> {
  const length = request.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_PROFILE_IMAGE_BYTES)) throw new Error('size')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('image')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_PROFILE_IMAGE_BYTES) {
        void reader.cancel().catch(() => {})
        throw new Error('size')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  if (!size) throw new Error('image')
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

export async function normalizeProfileImage(bytes: Uint8Array, contentType: string): Promise<Buffer> {
  if (bytes.byteLength > MAX_PROFILE_IMAGE_BYTES) throw new Error('size')
  if (!(PROFILE_IMAGE_TYPES as readonly string[]).includes(contentType)) throw new Error('image')
  const pipeline = sharp(bytes, { limitInputPixels: 20_000_000, failOn: 'warning', animated: false })
  const meta = await pipeline.metadata()
  const expected = contentType === 'image/jpeg' ? 'jpeg' : contentType.slice(6)
  if (meta.format !== expected || (meta.pages ?? 1) !== 1 || !meta.width || !meta.height) throw new Error('image')
  // Re-encode, auto-orient, and omit metadata: no EXIF/GPS or original filename.
  const output = await pipeline.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  if (output.byteLength > 2 * 1024 * 1024) throw new Error('size')
  return output
}
