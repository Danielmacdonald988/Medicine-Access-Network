import type { Metadata } from 'next'
import { SavedGuides } from '@/components/saved/SavedGuides'

export const metadata: Metadata = {
  title: 'Saved guides',
  description: 'Compare the guides you saved in this browser tab.',
  robots: { index: false, follow: false },
}

export default function SavedGuidesPage() {
  return <div className="network-shell py-10 sm:py-14">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Your saved guides</p>
    <h1 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-stone-900 sm:text-5xl lg:text-6xl">A little space <em className="font-medium text-[#657f48]">to compare.</em></h1>
    <p className="mt-5 max-w-2xl leading-7 text-stone-600">Take your time with up to 3 guides. Compare their approach, format, and fees, then decide who you would like to contact. Saving a guide does not contact them.</p>
    <div className="mt-6 max-w-3xl rounded-xl border border-stone-200 bg-[#e9eee5] p-5">
      <p className="text-sm font-medium text-stone-900">Saved for this browsing session. No account needed.</p>
      <p className="mt-2 text-xs leading-relaxed text-stone-600">Only profile IDs are saved in this browser tab. Anyone using this tab can see your selection; clear it when you are finished. Browser session restoration may restore it.</p>
    </div>
    <SavedGuides />
  </div>
}
