import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import sharp from 'sharp'
import ts from 'typescript'
import * as media from '../lib/profile-media'
import * as images from '../lib/normalize-profile-image'
import * as body from '../lib/request-body'

const require = createRequire(import.meta.url)
const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const photo = '33333333-3333-4333-8333-333333333333.webp'
const path = `${owner}/${photo}`
const endpoint = 'https://directory.test/api/profile-images'
const secretDetail = 'private-storage-details-and-service-key'
const png = sharp({ create: { width: 32, height: 20, channels: 3, background: '#00695c' } }).png().toBuffer()

function imageRequest(bytes: Uint8Array, headers: Record<string, string> = {}) {
  return new Request(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'image/png', origin: 'https://directory.test', ...headers },
    body: new Uint8Array(bytes),
  })
}

function deleteRequest(value: unknown, headers: Record<string, string> = {}) {
  return new Request(endpoint, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', origin: 'https://directory.test', ...headers },
    body: JSON.stringify(value),
  })
}

test('image paths accept only canonical owned WebP objects, never URLs, traversal or trailing controls', () => {
  assert.equal(media.isProfileImagePath(path), true)
  assert.equal(media.ownsProfileImage(path, owner), true)
  assert.equal(media.ownsProfileImage(path, other), false)
  assert.equal(media.profileImageUrl(path), `/api/profile-images/${path}`)
  for (const input of [null, {}, '', `https://storage.test/${path}`, `/${path}`, `${path}\n`, `${path}\r`, `${path}\0`, `${path}?x=1`, `${path}/extra`, `${owner}/../${photo}`, `${owner}/%2e%2e/${photo}`, path.replace('.webp', '.svg'), path.replace('33333333', 'ABCDEF33')]) {
    assert.equal(media.isProfileImagePath(input), false, String(input))
    assert.equal(media.ownsProfileImage(input, owner), false)
    assert.equal(media.profileImageUrl(input), null)
  }
})

test('real image processing removes metadata, honors orientation and bounds large photographs', async () => {
  const input = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#005544' } })
    .withMetadata({ orientation: 6 })
    .withExifMerge({ IFD0: { Artist: 'Private test photographer', ImageDescription: 'Private camera metadata' } })
    .jpeg().toBuffer()
  const before = await sharp(input).metadata()
  assert.ok(before.exif, 'fixture must actually contain removable EXIF')
  assert.equal(before.orientation, 6)
  const normalized = await images.normalizeProfileImage(input, 'image/jpeg')
  const after = await sharp(normalized).metadata()
  assert.equal(after.format, 'webp')
  assert.equal(after.width, 800)
  assert.equal(after.height, 1600)
  assert.equal(after.exif, undefined)
  assert.equal(after.icc, undefined)
  assert.equal(after.xmp, undefined)
  assert.equal(after.orientation, undefined)
  assert.ok(normalized.byteLength <= 2 * 1024 * 1024)
  assert.ok(!normalized.includes(Buffer.from('Private test photographer')))
  const small = await sharp(await images.normalizeProfileImage(await png, 'image/png')).metadata()
  assert.deepEqual([small.width, small.height], [32, 20], 'small photos are not enlarged')
})

test('real image decoding rejects false MIME labels, SVG content and corrupt bytes', async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>')
  for (const [bytes, type] of [[await png, 'image/jpeg'], [svg, 'image/png'], [svg, 'image/svg+xml'], [Buffer.from('not an image'), 'image/webp'], [Buffer.alloc(0), 'image/jpeg']] as const) {
    await assert.rejects(images.normalizeProfileImage(bytes, type))
  }
  await assert.rejects(images.normalizeProfileImage(new Uint8Array(media.MAX_PROFILE_IMAGE_BYTES + 1), 'image/png'), /size/)
})

test('real image decoding refuses animated WebP and images above the pixel limit', async () => {
  // Two different 2x2 frames, produced locally; no downloaded or public images.
  const pixels = Buffer.from([255,0,0, 255,0,0, 255,0,0, 255,0,0, 0,0,255, 0,0,255, 0,0,255, 0,0,255])
  const animated = await sharp(pixels, { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } })
    .webp({ loop: 0, delay: [100, 100] }).toBuffer()
  assert.equal((await sharp(animated, { animated: true }).metadata()).pages, 2, 'fixture must contain two frames')
  await assert.rejects(images.normalizeProfileImage(animated, 'image/webp'), /image/)
  const tooManyPixels = await sharp({ create: { width: 5000, height: 4001, channels: 3, background: '#336644' } }).png().toBuffer()
  assert.ok(tooManyPixels.byteLength < media.MAX_PROFILE_IMAGE_BYTES, 'pixel protection must operate independently of compressed size')
  await assert.rejects(images.normalizeProfileImage(tooManyPixels, 'image/png'))
})

test('stream byte limits do not trust a missing or falsely small Content-Length', async () => {
  for (const headers of [{}, { 'content-length': '1' }]) {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(media.MAX_PROFILE_IMAGE_BYTES))
        controller.enqueue(new Uint8Array(1))
      },
      cancel() { cancelled = true },
    })
    const request = new Request(endpoint, { method: 'POST', headers, body: stream, duplex: 'half' } as RequestInit & { duplex: 'half' })
    await assert.rejects(images.readImageBytes(request), /size/)
    assert.equal(cancelled, true, 'the oversized stream is cancelled')
    assert.equal(request.body?.locked, false, 'the reader lock is released after rejection')
  }
  for (const declared of ['-1', 'invalid', String(media.MAX_PROFILE_IMAGE_BYTES + 1)]) {
    await assert.rejects(images.readImageBytes(imageRequest(await png, { 'content-length': declared })), /size/)
  }
  await assert.rejects(images.readImageBytes(new Request(endpoint, { method: 'POST' })), /image/)
  assert.deepEqual(await images.readImageBytes(imageRequest(await png)), new Uint8Array(await png))
})

type Event = { op: string; [key: string]: unknown }
type FileEntry = { name: string; created_at: string | null }
type FixtureOptions = {
  user?: string | null
  role?: string | null
  authError?: boolean
  profile?: { id?: string; image_paths?: string[] } | null
  publicProfile?: { id: string } | null
  reviewableProfile?: { id: string } | null
  queryError?: string
  storageError?: 'list' | 'upload' | 'remove' | 'download'
  files?: FileEntry[]
  downloadMissing?: boolean
}
type Routes = {
  POST: (request: Request) => Promise<Response>
  DELETE: (request: Request) => Promise<Response>
  GET: (request: Request, context: { params: Promise<{ path: string[] }> }) => Promise<Response>
}

function fixture(options: FixtureOptions = {}) {
  const events: Event[] = []
  const error = { message: secretDetail }
  const user = options.user === undefined ? owner : options.user
  function query(client: string, table: string) {
    const call: Event = { op: 'query', client, table, equals: {}, contains: {} }
    events.push(call)
    const result = () => {
      const data = table === 'users' ? { role: options.role === undefined ? 'facilitator' : options.role }
        : client === 'admin' ? options.profile ?? null
          : table === 'facilitator_public_profiles' ? options.publicProfile ?? null
            : options.reviewableProfile ?? null
      return { data, error: options.queryError === `${client}.${table}` ? error : null }
    }
    const builder = {
      select(columns: string) { call.columns = columns; return builder },
      eq(column: string, value: unknown) { (call.equals as Record<string, unknown>)[column] = value; return builder },
      contains(column: string, value: unknown) { (call.contains as Record<string, unknown>)[column] = value; return builder },
      limit(value: number) { call.limit = value; return builder },
      async maybeSingle() { return result() },
    }
    return builder
  }
  const bucket = {
    async list(prefix: string, listOptions: unknown) {
      events.push({ op: 'list', prefix, options: listOptions })
      return { data: options.files ?? [], error: options.storageError === 'list' ? error : null }
    },
    async upload(objectPath: string, bytes: Buffer, uploadOptions: unknown) {
      events.push({ op: 'upload', path: objectPath, bytes, options: uploadOptions })
      return { error: options.storageError === 'upload' ? error : null }
    },
    async remove(paths: string[]) {
      events.push({ op: 'remove', paths })
      return { error: options.storageError === 'remove' ? error : null }
    },
    async download(objectPath: string) {
      events.push({ op: 'download', path: objectPath })
      return { data: options.downloadMissing ? null : new Blob(['private-image-bytes'], { type: 'image/webp' }), error: options.storageError === 'download' ? error : null }
    },
  }
  const mocks: Record<string, unknown> = {
    '@/lib/profile-media': media,
    '@/lib/request-body': body,
    '@/lib/normalize-profile-image': images,
    '@/lib/supabaseServer': {
      async createServerSupabaseClient() {
        events.push({ op: 'server-client' })
        return {
          auth: { async getUser() { events.push({ op: 'authenticate' }); return { data: { user: user ? { id: user } : null }, error: options.authError ? error : null } } },
          from: (table: string) => query('server', table),
        }
      },
    },
    '@/lib/supabaseAdmin': {
      createAdminSupabaseClient() {
        events.push({ op: 'service-client' })
        return {
          from: (table: string) => query('admin', table),
          storage: { from(name: string) { events.push({ op: 'bucket', name }); return bucket } },
        }
      },
    },
  }
  function load(file: string) {
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const loaded = { exports: {} as Partial<Routes> }
    new Function('require', 'module', 'exports', code)((name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports)
    return loaded.exports
  }
  const route = { ...load('../app/api/profile-images/route.ts'), ...load('../app/api/profile-images/[...path]/route.ts') } as Routes
  return {
    route, events,
    get: (objectPath = path) => route.GET(new Request(`${endpoint}/${objectPath}`), { params: Promise.resolve({ path: objectPath.split('/') }) }),
  }
}

function noServiceClient(events: Event[]) {
  assert.equal(events.some(event => event.op === 'service-client'), false, 'privileged storage client must not be created before authorization')
}

function privateResponse(response: Response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
}

test('cross-site uploads and removals are refused before authentication or storage access', async () => {
  for (const headers of [{ origin: 'https://unrelated.test' }, { 'sec-fetch-site': 'cross-site' }] as Record<string, string>[]) {
    for (const method of ['POST', 'DELETE'] as const) {
      const { route, events } = fixture()
      const request = method === 'POST' ? imageRequest(await png, headers) : deleteRequest({ path }, headers)
      const response = await route[method](request)
      assert.equal(response.status, 403)
      assert.deepEqual(events, [])
      privateResponse(response)
    }
  }
})

test('only an authenticated facilitator can upload or delete; service credentials stay unused on rejection', async () => {
  for (const options of [{ user: null }, { authError: true }, { role: 'seeker' }, { role: 'admin' }, { role: null }, { queryError: 'server.users' }]) {
    for (const method of ['POST', 'DELETE'] as const) {
      const { route, events } = fixture(options)
      const response = await route[method](method === 'POST' ? imageRequest(await png) : deleteRequest({ path }))
      assert.equal(response.status, 401)
      noServiceClient(events)
      privateResponse(response)
      assert.doesNotMatch(await response.text(), new RegExp(secretDetail))
    }
  }
})

test('uploads validate MIME and actual bytes before obtaining privileged storage access', async () => {
  for (const [request, status] of [
    [imageRequest(await png, { 'content-type': 'image/svg+xml' }), 415],
    [imageRequest(await png, { 'content-type': 'image/jpeg' }), 400],
    [imageRequest(Buffer.from('corrupt image')), 400],
    [imageRequest(await png, { 'content-length': String(media.MAX_PROFILE_IMAGE_BYTES + 1) }), 413],
  ] as const) {
    const { route, events } = fixture()
    const response = await route.POST(request)
    assert.equal(response.status, status)
    noServiceClient(events)
    privateResponse(response)
  }
})

test('a successful upload stores re-encoded WebP under its authenticated owner with no overwrite', async () => {
  const { route, events } = fixture()
  const response = await route.POST(imageRequest(await png))
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(media.ownsProfileImage(result.path, owner), true)
  assert.equal(result.url, media.profileImageUrl(result.path))
  assert.equal(events.find(event => event.op === 'list')?.prefix, owner)
  const upload = events.find(event => event.op === 'upload')!
  assert.equal(upload.path, result.path)
  assert.deepEqual(upload.options, { contentType: 'image/webp', upsert: false, cacheControl: '0' })
  assert.equal((await sharp(upload.bytes as Buffer).metadata()).format, 'webp')
  assert.equal(events.filter(event => event.op === 'bucket').every(event => event.name === media.PROFILE_IMAGE_BUCKET), true)
  assert.ok(events.findIndex(event => event.op === 'authenticate') < events.findIndex(event => event.op === 'service-client'))
  privateResponse(response)
})

test('upload quota fails closed and cleanup removes only old, unused, canonical owner objects', async () => {
  const makeFile = (n: number, created_at: string | null = new Date().toISOString()) => ({ name: `44444444-4444-4444-8444-${String(n).padStart(12, '0')}.webp`, created_at })
  const full = fixture({ files: Array.from({ length: media.MAX_STORED_PROFILE_IMAGES }, (_, n) => makeFile(n)) })
  assert.equal((await full.route.POST(imageRequest(await png))).status, 429)
  assert.equal(full.events.some(event => event.op === 'upload' || event.op === 'remove'), false)
  const old = new Date(Date.now() - 2 * 86_400_000).toISOString()
  const saved = makeFile(1, old), unused = makeFile(2, old), recent = makeFile(3), noDate = makeFile(4, null)
  const cleanup = fixture({ profile: { image_paths: [`${owner}/${saved.name}`] }, files: [saved, unused, recent, noDate, { name: '../foreign.webp', created_at: old }] })
  assert.equal((await cleanup.route.POST(imageRequest(await png))).status, 201)
  assert.deepEqual(cleanup.events.find(event => event.op === 'remove')?.paths, [`${owner}/${unused.name}`])
})

test('upload and cleanup failures return generic errors and never report an unsuccessful upload as saved', async () => {
  for (const options of [
    { storageError: 'list' as const },
    { storageError: 'upload' as const },
    { queryError: 'admin.facilitator_profiles' },
    { storageError: 'remove' as const, files: [{ name: photo, created_at: new Date(Date.now() - 2 * 86_400_000).toISOString() }] },
  ]) {
    const { route } = fixture(options)
    const response = await route.POST(imageRequest(await png))
    assert.equal(response.status, 503)
    const result = await response.json()
    assert.equal(result.path, undefined)
    assert.equal(result.url, undefined)
    assert.doesNotMatch(JSON.stringify(result), new RegExp(secretDetail))
    privateResponse(response)
  }
})

test('deletion rejects another owner, malformed paths, and invalid JSON before privileged access', async () => {
  for (const value of [{ path: `${other}/${photo}` }, { path: `${path}\n` }, { path: `https://storage.test/${path}` }, { path: null }, { unrelated: path }]) {
    const { route, events } = fixture()
    assert.equal((await route.DELETE(deleteRequest(value))).status, 404)
    noServiceClient(events)
  }
  const invalidJson = fixture()
  assert.equal((await invalidJson.route.DELETE(new Request(endpoint, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: '{broken' }))).status, 400)
  noServiceClient(invalidJson.events)
})

test('deletion preserves saved photographs and permits removal only after they are detached', async () => {
  const saved = fixture({ profile: { id: 'saved-profile' } })
  const protectedResponse = await saved.route.DELETE(deleteRequest({ path }))
  assert.equal(protectedResponse.status, 409)
  assert.equal(saved.events.some(event => event.op === 'remove'), false)
  const detached = fixture()
  const response = await detached.route.DELETE(deleteRequest({ path }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true })
  assert.deepEqual(detached.events.find(event => event.op === 'remove')?.paths, [path])
  const lookup = detached.events.find(event => event.op === 'query' && event.client === 'admin')!
  assert.deepEqual(lookup.equals, { user_id: owner })
  assert.deepEqual(lookup.contains, { image_paths: [path] })
  privateResponse(response)
})

test('deletion database and storage failures expose no internal diagnostics', async () => {
  for (const options of [{ queryError: 'admin.facilitator_profiles' }, { storageError: 'remove' as const }]) {
    const { route } = fixture(options)
    const response = await route.DELETE(deleteRequest({ path }))
    assert.equal(response.status, 503)
    assert.doesNotMatch(await response.text(), new RegExp(secretDetail))
    privateResponse(response)
  }
})

test('image reads reject malformed paths before consulting authentication or storage', async () => {
  for (const invalid of ['not-a-file', `${path}\n`, `${owner}/../${photo}`, `${path}/extra`]) {
    const { get, events } = fixture()
    const response = await get(invalid)
    assert.equal(response.status, 404)
    assert.deepEqual(events, [])
    privateResponse(response)
  }
})

test('anonymous visitors can read only images referenced by currently public profiles', async () => {
  const hidden = fixture({ user: null })
  assert.equal((await hidden.get()).status, 404)
  noServiceClient(hidden.events)
  const published = fixture({ user: null, publicProfile: { id: 'published-profile' } })
  const response = await published.get()
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'private-image-bytes')
  const lookup = published.events.find(event => event.op === 'query')!
  assert.equal(lookup.table, 'facilitator_public_profiles')
  assert.deepEqual(lookup.contains, { image_paths: [path] })
  assert.equal(response.headers.get('content-type'), 'image/webp')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.match(response.headers.get('content-security-policy') ?? '', /default-src 'none'/)
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="profile-photo.webp"')
  privateResponse(response)
})

test('owners can preview uploads while other facilitators cannot read unpublished images', async () => {
  const owned = fixture()
  assert.equal((await owned.get()).status, 200)
  assert.equal(owned.events.some(event => event.op === 'query'), false, 'an owner preview does not require a published profile')
  const unrelated = fixture({ user: other })
  assert.equal((await unrelated.get()).status, 404)
  noServiceClient(unrelated.events)
  assert.equal(unrelated.events.some(event => event.op === 'query' && event.table === 'facilitator_profiles'), false)
})

test('administrators can review referenced private images but cannot enumerate abandoned uploads', async () => {
  const reviewed = fixture({ user: other, role: 'admin', reviewableProfile: { id: 'pending-profile' } })
  assert.equal((await reviewed.get()).status, 200)
  assert.ok(reviewed.events.some(event => event.op === 'query' && event.client === 'server' && event.table === 'facilitator_profiles'))
  const abandoned = fixture({ user: other, role: 'admin' })
  assert.equal((await abandoned.get()).status, 404)
  noServiceClient(abandoned.events)
})

test('image lookup failures remain generic and unavailable objects reveal no storage diagnostics', async () => {
  for (const options of [
    { user: null, queryError: 'server.facilitator_public_profiles' },
    { user: other, queryError: 'server.users' },
    { user: other, role: 'admin', queryError: 'server.facilitator_profiles' },
  ]) {
    const { get, events } = fixture(options)
    const response = await get()
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('retry-after'), '30')
    assert.equal(await response.text(), '')
    noServiceClient(events)
  }
  for (const options of [{ storageError: 'download' as const }, { downloadMissing: true }]) {
    const response = await fixture(options).get()
    assert.equal(response.status, 404)
    assert.equal(await response.text(), '')
    privateResponse(response)
  }
})
