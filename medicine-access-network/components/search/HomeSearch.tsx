import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function HomeSearch() {
  return (
    <div className="rounded-2xl bg-white p-6 text-stone-900 shadow-xl shadow-black/10 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Find a guide</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">Start with what you’re looking for. You can refine your search as you go.</p>
      <form action="/facilitators" method="get" role="search" aria-label="Find a guide" className="mt-6 space-y-4">
        <div>
          <label htmlFor="home-support" className="mb-2 block text-sm font-semibold">What support are you looking for?</label>
          <Input id="home-support" name="q" type="search" maxLength={120} placeholder="Integration, breathwork, or a guide’s name" className="h-12 bg-white" />
        </div>
        <div>
          <label htmlFor="home-location" className="mb-2 block text-sm font-semibold">Location <span className="font-normal text-stone-500">(optional)</span></label>
          <Input id="home-location" name="location" maxLength={100} placeholder="City, region, or country" className="h-12 bg-white" />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" name="remote" value="true" className="size-4 accent-emerald-700" />
          Show guides offering online sessions
        </label>
        <Button type="submit" className="min-h-12 w-full bg-emerald-700 text-base hover:bg-emerald-800"><Search aria-hidden className="size-4" /> Find a guide</Button>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 text-sm">
        <p className="text-stone-500">No account needed.</p>
        <Link href="/facilitators" className="inline-flex min-h-9 items-center gap-1 font-medium text-emerald-800 underline underline-offset-4">Browse all guides <ArrowRight aria-hidden className="size-4" /></Link>
      </div>
    </div>
  )
}
