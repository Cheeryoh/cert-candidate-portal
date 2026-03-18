import type { NextConfig } from 'next'

// Supabase project origin — restricts connect-src to only the known backend.
// Falls back to *.supabase.co wildcard if the env var is not available at
// build time (e.g. CI preview builds).
const supabaseOrigin =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co'

const csp = [
  "default-src 'self'",
  // Next.js inlines small scripts and React uses eval in dev
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind v4 and Sonner use inline styles
  "style-src 'self' 'unsafe-inline'",
  // Self-hosted fonts (next/font downloads at build time)
  "font-src 'self'",
  // Avatars, Open Graph images, data URIs for UI components
  "img-src 'self' data: blob: https:",
  // Supabase REST + Realtime WebSocket
  `connect-src 'self' ${supabaseOrigin} wss://*.supabase.co`,
  // No plugins, objects, or base-tag hijacking
  "object-src 'none'",
  "base-uri 'self'",
  // Prevent clickjacking via CSP (supersedes X-Frame-Options)
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Clickjacking — belt-and-suspenders alongside frame-ancestors in CSP
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter (IE/old Edge)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Don't send full URL in Referer header to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year once deployed (Vercel enforces HTTPS anyway)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Disable browser features not used by this app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  { key: 'Content-Security-Policy', value: csp },
]

const nextConfig: NextConfig = {
  // Do not advertise the framework version to scanners
  poweredByHeader: false,

  headers: async () => [
    {
      // Apply to all routes; static assets are served from _next/ which is
      // already excluded from the middleware matcher
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
}

export default nextConfig
