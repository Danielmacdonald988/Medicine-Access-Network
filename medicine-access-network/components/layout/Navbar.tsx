'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logomark } from '@/components/icons/logomark'
import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'

const navLinks = [
  { href: '/facilitators', label: 'Find a Guide' },
  { href: '/resources', label: 'Safety library' },
  { href: '/onboarding/facilitator', label: 'Become a Guide' },
]

interface NavbarProps {
  user?: { full_name: string; email: string; role: string } | null
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <Logomark className="h-5 w-5 text-emerald-700" />
          <span className="text-sm sm:text-base">{APP_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
              className={`text-sm font-medium transition-colors hover:text-emerald-700 ${
                pathname.startsWith(href) ? 'text-emerald-700' : 'text-stone-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <DropdownMenu>
              {/* Base UI Trigger — renders a <button> directly, no asChild needed */}
              <DropdownMenuTrigger aria-label="Account menu" className="relative flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  Dashboard
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/api/auth/signout" prefetch={false} />}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Guide sign in</Link>
              </Button>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" asChild>
                <Link href="/signup">Join as a guide</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          ref={menuButton}
          type="button"
          className="flex size-11 items-center justify-center rounded-lg text-stone-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-stone-200 bg-white px-4 pb-4 pt-2 md:hidden" onKeyDown={(event) => { if (event.key === 'Escape') { setMobileOpen(false); menuButton.current?.focus() } }} onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setMobileOpen(false) }}>
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center text-sm font-medium text-stone-700"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" className="flex min-h-11 items-center text-sm font-medium text-stone-700">
                  Dashboard
                </Link>
                <Link href="/api/auth/signout" prefetch={false} className="flex min-h-11 items-center text-sm font-medium text-stone-600">
                  Sign out
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Guide sign in</Link>
                </Button>
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" asChild>
                  <Link href="/signup">Join as a guide</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
