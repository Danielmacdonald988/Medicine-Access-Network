"use client";

import { useTranslation } from "@/components/i18n/TranslationProvider";

import Link from "next/link";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logomark } from "@/components/icons/logomark";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { SavedGuidesLink } from "@/components/saved/SavedGuidesLink";

const navLinks = [
  { href: "/facilitators", label: "Explore support" },
  { href: "/resources", label: "Safety library" },
  { href: "/about", label: "Our approach" },
];

interface NavbarProps {
  user?: { full_name: string; email: string; role: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <>
      {pathname === "/" && (
        <div className="flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#e8eddf] px-4 py-2 text-center text-xs text-foreground">
          <span
            className="size-1.5 rounded-full bg-[#6f8654]"
            aria-hidden="true"
          />
          <span>{t("A new way to find your people.")}</span>
          <Link
            href="/facilitators"
            className="inline-flex items-center gap-1.5 border-b border-[#779070] font-medium hover:text-primary"
          >
            {" "}
            {t("Explore the network")}{" "}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
      <header
        className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur"
        onKeyDown={(event) => {
          if (event.key === "Escape" && mobileOpen) {
            event.preventDefault();
            setMobileOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="network-shell flex h-20 items-center justify-between gap-5 xl:h-24">
          {/* Logo */}
          <Link
            href="/"
            aria-label={t("{appName} home", { appName: APP_NAME })}
            className="flex shrink-0 items-center gap-2 text-foreground"
          >
            <Logomark className="size-9 sm:size-11" />
            <span
              aria-hidden="true"
              className="text-base leading-[1.02] tracking-[-0.035em] sm:text-lg"
            >
              the facilitator
              <br />
              <strong className="font-semibold">network</strong>
              <span className="text-[#829656]">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label={t("Main navigation")}
            className="hidden items-center gap-5 xl:flex"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className={`text-sm transition-colors hover:text-primary ${
                  pathname.startsWith(href)
                    ? "font-semibold text-primary"
                    : "text-foreground"
                }`}
              >
                {t(label)}
              </Link>
            ))}
            <SavedGuidesLink className="text-sm text-foreground hover:text-primary" />
          </nav>

          {/* Auth actions */}
          <div className="hidden items-center gap-2 xl:flex">
            <LanguageSelector />
            {user?.role === "facilitator" && (
              <Button variant="outline" className="h-11 bg-transparent" asChild>
                <Link href="/facilitator/edit">{t("Edit my profile")}</Link>
              </Button>
            )}
            {user ? (
              <DropdownMenu>
                {/* Base UI Trigger — renders a <button> directly, no asChild needed */}
                <DropdownMenuTrigger
                  aria-label={t("Account menu")}
                  className="relative flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
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
                    {" "}
                    {t("Dashboard")}{" "}
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      {" "}
                      {t("Admin")}{" "}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <form action="/api/auth/signout" method="post">
                    <DropdownMenuItem
                      nativeButton
                      render={<button type="submit" className="w-full" />}
                    >
                      {" "}
                      {t("Sign out")}{" "}
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground"
                  asChild
                >
                  <Link href="/login">{t("Sign in")}</Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 gap-2.5 rounded-lg border-[#a7b3a0] bg-transparent px-4 text-foreground hover:bg-secondary"
                  asChild
                >
                  <Link href="/onboarding/facilitator">
                    {t("For facilitators")}{" "}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            ref={menuButton}
            type="button"
            className="flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t(mobileOpen ? "Close menu" : "Open menu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div
            id="mobile-navigation"
            className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-background py-4 xl:hidden"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a"))
                setMobileOpen(false);
            }}
          >
            <div className="network-shell">
              <nav
                aria-label={t("Mobile navigation")}
                className="flex flex-col gap-1"
              >
                <div className="pb-3">
                  <LanguageSelector />
                </div>
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={
                      pathname.startsWith(href) ? "page" : undefined
                    }
                    className="flex min-h-11 items-center text-sm font-medium text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(label)}
                  </Link>
                ))}
                <SavedGuidesLink className="flex min-h-11 items-center text-sm font-medium text-foreground" />
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex min-h-11 items-center text-sm font-medium text-stone-700"
                    >
                      {" "}
                      {t("Dashboard")}{" "}
                    </Link>
                    {user.role === "facilitator" && (
                      <Link
                        href="/facilitator/edit"
                        className="flex min-h-11 items-center text-sm font-semibold text-emerald-800"
                      >
                        {" "}
                        {t("Edit my profile")}{" "}
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex min-h-11 items-center text-sm font-medium text-foreground"
                      >
                        {" "}
                        {t("Admin")}{" "}
                      </Link>
                    )}
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex min-h-11 items-center text-sm font-medium text-stone-600"
                      >
                        {" "}
                        {t("Sign out")}{" "}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="h-11 bg-transparent"
                      asChild
                    >
                      <Link href="/login">{t("Facilitator sign in")}</Link>
                    </Button>
                    <Button className="h-11" asChild>
                      <Link href="/onboarding/facilitator">
                        {t("List your practice")}{" "}
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
