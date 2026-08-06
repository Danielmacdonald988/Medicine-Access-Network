import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Moved out of proxy.ts: these used to be set in middleware, which meant
  // every request paid for a middleware invocation (Supabase cookie
  // exchange included) just to get security headers. Config-level headers
  // apply to every route — including the now-public, crawlable
  // browse/search/facilitator-detail pages — without that cost. See
  // proxy.ts for the auth-gated routes that still need real middleware.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;