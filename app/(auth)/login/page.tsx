'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AnthropicLogo } from '@/components/brand/anthropic-logo'
import { toast } from 'sonner'
import { loginAction } from './actions'

// Demo auto-fill — controlled by NEXT_PUBLIC_DEMO_MODE env var.
// Embedded in the JS bundle at build time; only use a dedicated demo account.
// Toggle: set NEXT_PUBLIC_DEMO_MODE=true in Vercel and redeploy to enable,
// remove the variable and redeploy to disable.
const DEMO_MODE     = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const DEMO_EMAIL    = process.env.NEXT_PUBLIC_DEMO_EMAIL    ?? ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? ''

export default function LoginPage() {
  const router = useRouter()

  // State is initialised directly from build-time constants —
  // no useEffect needed, no flash of empty fields.
  const [email, setEmail]       = useState(DEMO_MODE ? DEMO_EMAIL    : '')
  const [password, setPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : '')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await loginAction(email, password)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      {/* Top-right Academy link */}
      <div className="absolute top-5 right-6">
        <a
          href="https://anthropic.skilljar.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-colors text-foreground/55 hover:text-foreground"
        >
          Anthropic Academy →
        </a>
      </div>

      {/* Logo */}
      <AnthropicLogo className="mb-8 text-foreground" />

      {/* Sign-in card */}
      <div className="w-full max-w-sm rounded-md p-8 bg-card border border-border">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Certification Portal</p>
          {DEMO_MODE && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              Demo access
            </span>
          )}
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded px-3 py-2 text-sm text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded px-3 py-2 text-sm text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
