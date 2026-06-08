import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-5xl font-bold text-stone-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-2 text-sm text-stone-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/facilitators">Browse guides</Link>
        </Button>
      </div>
    </div>
  )
}
