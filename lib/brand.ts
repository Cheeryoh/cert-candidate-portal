/**
 * Brand configuration — controlled by BRAND_NAME env var (server-side only).
 *
 * This is a plain (non-NEXT_PUBLIC) env var so it is read at request time on
 * the server, not baked into the client bundle at build time. Changing the
 * variable in Vercel takes effect on the next request with no rebuild needed.
 *
 * To switch branding in Vercel:
 *   1. Go to Project Settings → Environment Variables
 *   2. Add BRAND_NAME = "CoreCompetencies Inc."  (no NEXT_PUBLIC_ prefix)
 *   3. Save — change is live immediately (no redeploy required)
 *
 * Client components receive the value via BrandProvider in app/layout.tsx.
 */

export const BRAND_NAME: string =
  process.env.BRAND_NAME ?? 'ANTHROP\\C'

/** True when using the default Anthropic wordmark styling */
export const IS_DEFAULT_BRAND: boolean =
  !process.env.BRAND_NAME
