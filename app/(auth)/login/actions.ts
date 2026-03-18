'use server'

/**
 * Server Action: loginAction
 *
 * Handles all login logic server-side:
 *   1. Input validation (P3-2)
 *   2. Rate-limit check (P0-1)
 *   3. Supabase authentication
 *   4. Normalised error response — never reveals whether an account exists (P2-2)
 *
 * Returns { error: string } on failure, {} on success.
 * The client is responsible for the post-login redirect.
 */

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

// P2-2: single generic message for all auth failures
const AUTH_ERROR = 'Invalid email or password.'
const RATE_ERROR = 'Too many login attempts. Please wait 15 minutes and try again.'

// RFC 5321 max local+domain
const EMAIL_MAX_LENGTH = 254
// bcrypt silently truncates at 72 bytes
const PASSWORD_MAX_LENGTH = 72

function validateInputs(email: string, password: string): string | null {
  if (!email || typeof email !== 'string') return AUTH_ERROR
  if (!password || typeof password !== 'string') return AUTH_ERROR

  const trimmed = email.trim()
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) return AUTH_ERROR
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return AUTH_ERROR
  if (password.length === 0 || password.length > PASSWORD_MAX_LENGTH) return AUTH_ERROR

  return null
}

async function getClientIp(): Promise<string> {
  const h = await headers()
  // Vercel sets x-forwarded-for; fallback for other hosts
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    h.get('cf-connecting-ip') ??
    'unknown'
  )
}

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  // 1. Validate inputs
  const validationError = validateInputs(email, password)
  if (validationError) return { error: validationError }

  const cleanEmail = email.trim().toLowerCase()

  // 2. Rate limit
  const ip      = await getClientIp()
  const blocked = await checkRateLimit(ip)
  if (blocked) return { error: RATE_ERROR }

  // 3. Authenticate
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })

  if (error) {
    // Auth failure — do NOT reveal reason (user enumeration prevention)
    return { error: AUTH_ERROR }
  }

  // 4. Success — reset rate limit counter
  await resetRateLimit(ip)
  return {}
}
