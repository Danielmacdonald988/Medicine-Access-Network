import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink } from "@/components/ui/skip-link";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/constants";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  metadataBase: new URL(SITE_URL),
  robots:
    process.env.VERCEL_ENV === "preview"
      ? { index: false, follow: false }
      : undefined,
  openGraph: {
    siteName: APP_NAME,
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched at layout level so the Navbar knows whether a user is signed in.
  // This is a Server Component — no client-side fetch needed.
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SkipLink />
        <Navbar user={user} />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
