import type { Metadata } from 'next'
import { SavedGuides } from '@/components/saved/SavedGuides'

export const metadata: Metadata = {
  title: 'Saved guides',
  description: 'Compare the guides you saved in this browser tab.',
  robots: { index: false, follow: false },
}

export default function SavedGuidesPage() {
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Your saved guides</h1>
    <p className="mt-3 max-w-2xl leading-relaxed text-stone-600">Compare up to 3 guides, then decide who you would like to contact. Saving a guide does not contact them.</p>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">Your selection is kept in this browser tab for this browsing session. No account is created, and only profile IDs are saved. Anyone using this tab can see your selection; clear it when you are finished. Browser session restoration may restore it.</p>
    <SavedGuides />
  </div>
}
