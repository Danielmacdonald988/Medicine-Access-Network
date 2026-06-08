import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import '@/lib/env'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import { SkipLink } from '@/components/ui/skip-link'
import { getCurrentUser } from '@/lib/auth'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    siteName: APP_NAME,
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched at layout level so the Navbar knows whether a user is signed in.
  // This is a Server Component — no client-side fetch needed.
  const user = await getCurrentUser()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900">
        <SkipLink />
        <Navbar user={user} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
