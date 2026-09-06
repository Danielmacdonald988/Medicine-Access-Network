'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { savedGuideFee, type SavedGuideProfile } from '@/lib/saved-guides'
import { Button } from '@/components/ui/button'
import { clearSavedGuides, removeSavedGuide, useSavedGuides } from './useSavedGuides'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfileImageUrl } from '@/lib/profile-media'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; profiles: SavedGuideProfile[] }

function Comparison({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 10000)
    async function load() {
      try {
        const response = await fetch(`/api/facilitators?${new URLSearchParams({ ids: ids.join(',') })}`, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Unavailable')
        const result = await response.json()
        if (!Array.isArray(result.data)) throw new Error('Invalid response')
        if (active) setState({ status: 'ready', profiles: result.data.filter((profile: SavedGuideProfile) => ids.includes(profile.id)) })
      } catch {
        if (active) setState({ status: 'error' })
      } finally {
        clearTimeout(timeout)
      }
    }
    void load()
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [ids, attempt])

  if (state.status === 'loading') return <p role="status" className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">Checking current public profiles…</p>
  if (state.status === 'error') return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6">
    <h2 className="font-semibold text-stone-900">We could not check these profiles</h2>
    <p className="mt-2 text-sm leading-relaxed text-stone-700">The directory is temporarily unavailable. Your saved selection is still here; this does not mean the guides have been removed.</p>
    <Button variant="outline" onClick={() => { setState({ status: 'loading' }); setAttempt((value) => value + 1) }} className="mt-4 min-h-11">Try again</Button>
  </div>

  const profiles = ids.map((id) => state.profiles.find((profile) => profile.id === id))
  const rows: { label: string; value: (profile: SavedGuideProfile) => ReactNode }[] = [
    { label: 'Type of support', value: (profile) => profile.modalities.length ? profile.modalities.join(', ') : 'Ask the guide' },
    { label: 'Location', value: (profile) => profile.location || 'Ask the guide' },
    { label: 'Online support', value: (profile) => profile.remote_available ? 'Online sessions listed. Confirm they can work with you where you live.' : 'Not listed; ask the guide about session format.' },
    { label: 'Fees', value: savedGuideFee },
    { label: 'Practice experience', value: (profile) => typeof profile.years_experience === 'number' ? `${profile.years_experience} years, self-reported; may include personal practice.` : 'Not specified' },
    { label: 'Training & lineage', value: (profile) => <><p className="whitespace-pre-line">{profile.lineage_or_training || 'No training description listed.'}</p>{Boolean(profile.certifications?.length) && <p className="mt-2">{profile.certifications?.join(', ')}</p>}</> },
  ]

  return <div>
    <p className="mb-4 text-sm leading-relaxed text-stone-600">Shown in the order you saved them. This comparison does not rank or recommend guides. Details are supplied by each guide; confirm fees, session length, training, and fit directly.</p>
    <p className="mb-3 text-sm text-stone-600 lg:hidden">Scroll sideways to compare guides. Each column is a saved guide.</p>
    <div role="region" aria-label="Guide comparison; scroll horizontally on small screens" tabIndex={0} className="overflow-x-auto rounded-xl border border-stone-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      <table className="w-full table-fixed text-left text-sm" style={{ minWidth: 180 + ids.length * 230 }}>
        <caption className="sr-only">Current public information for your saved guides</caption>
        <thead>
          <tr className="border-b border-stone-200">
            <th scope="col" className="w-44 p-5 align-top text-stone-600">Compare guides</th>
            {ids.map((id, index) => {
              const profile = profiles[index]
              return <th scope="col" key={id} className="p-5 align-top font-normal">
                {profile ? <>
                  <Avatar className="mb-3 size-20 rounded-xl">
                    {getProfileImageUrl(profile.image_paths?.[0]) && <AvatarImage src={getProfileImageUrl(profile.image_paths?.[0])!} alt={profile.display_name} className="object-cover" />}
                    <AvatarFallback className="bg-emerald-100 font-medium text-emerald-800">{profile.display_name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/facilitators/${id}`} className="break-words text-lg font-semibold text-emerald-900 underline underline-offset-4">{profile.display_name}</Link>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{profile.bio}</p>
                  <Link href={`/facilitators/${id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4">View profile & contact</Link>
                </> : <>
                  <p className="font-semibold text-stone-900">Profile no longer available</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">This saved profile is no longer listed publicly. Its previous details are not stored here.</p>
                </>}
                <button type="button" onClick={() => onRemove(id)} aria-label={`Remove ${profile?.display_name ?? `unavailable guide ${index + 1}`} from saved guides`} className="mt-2 block min-h-11 rounded text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Remove</button>
              </th>
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, value }) => <tr key={label} className="border-b border-stone-100 last:border-0">
            <th scope="row" className="bg-stone-50 p-5 align-top font-medium text-stone-900">{label}</th>
            {profiles.map((profile, index) => <td key={ids[index]} className="break-words p-5 align-top leading-relaxed text-stone-600">{profile ? value(profile) : <span aria-label="Not available">—</span>}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="mt-5 text-sm text-stone-600">Before choosing, read{' '}<Link href="/resources/questions-to-ask" className="font-medium text-emerald-800 underline underline-offset-4">questions to ask a guide</Link>{' '}and{' '}<Link href="/about#profile-review" className="font-medium text-emerald-800 underline underline-offset-4">what profile review means</Link>.</p>
  </div>
}

export function SavedGuides() {
  const { ids, snapshot } = useSavedGuides()
  const [message, setMessage] = useState('')
  const statusRef = useRef<HTMLParagraphElement>(null)
  const announce = (text: string) => {
    setMessage(text)
    // Focus a stable element after the removed column (or table) unmounts.
    requestAnimationFrame(() => statusRef.current?.focus())
  }
  return <div className="mt-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Link href="/facilitators" className="inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4">Browse guides</Link>
      {ids.length > 0 && <Button variant="outline" className="min-h-11" onClick={() => announce(clearSavedGuides() ?? 'Your saved guides have been cleared.')}>Clear saved guides</Button>}
    </div>
    <p ref={statusRef} role="status" tabIndex={-1} className={message ? 'mb-5 rounded text-sm text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700' : 'sr-only'}>{message}</p>
    {ids.length ? <Comparison key={snapshot} ids={ids} onRemove={(id) => announce(removeSavedGuide(id) ?? 'Guide removed from your saved selection.')} /> : <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
      <h2 className="text-xl font-semibold text-stone-900">No guides saved yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">Use Save on a guide’s card or profile to compare their approach, format, and fees here.</p>
      <Button asChild className="mt-5 min-h-11 bg-emerald-700 hover:bg-emerald-800"><Link href="/facilitators">Find a guide</Link></Button>
    </div>}
  </div>
}
