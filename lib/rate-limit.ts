/**
 * Server-side login rate limiter backed by Supabase (login_rate_limits table).
 * Persists across serverless cold starts and multiple instances — no Redis needed
 * for single-region deployments.  For multi-region swap the Supabase calls for
 * an Upstash Redis sliding-window counter.
 *
 * Policy: 5 attempts per 15-minute window → 15-minute lockout.
 * Identifiers are SHA-256(ip + RATE_LIMIT_SALT) so no raw IPs are stored.
 */

import { createClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS    = 5
const WINDOW_MS       = 15 * 60 * 1000   // 15 min
const LOCKOUT_MS      = 15 * 60 * 1000   // 15 min

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function hashIdentifier(raw: string): Promise<string> {
  const salt    = process.env.RATE_LIMIT_SALT ?? 'default-dev-salt'
  const encoder = new TextEncoder()
  const data    = encoder.encode(raw + salt)
  const buf     = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Returns true (blocked) if the identifier is locked out.
 * Increments the attempt counter and applies lockout when the threshold
 * is reached.  Call this BEFORE attempting authentication.
 *
 * Gracefully degrades (returns false / not blocked) if the Supabase
 * call fails — rate limiting must never prevent legitimate logins.
 */
export async function checkRateLimit(rawIdentifier: string): Promise<boolean> {
  try {
    const id  = await hashIdentifier(rawIdentifier)
    const db  = getClient()
    const now = new Date()

    const { data: row } = await db
      .from('login_rate_limits')
      .select('attempts, window_start, locked_until')
      .eq('identifier', id)
      .maybeSingle()

    // Locked out?
    if (row?.locked_until && new Date(row.locked_until) > now) return true

    // Window expired — reset
    if (row && now.getTime() - new Date(row.window_start).getTime() >= WINDOW_MS) {
      await db
        .from('login_rate_limits')
        .update({ attempts: 1, window_start: now.toISOString(), locked_until: null, updated_at: now.toISOString() })
        .eq('identifier', id)
      return false
    }

    // First ever attempt
    if (!row) {
      await db.from('login_rate_limits').insert({
        identifier: id, attempts: 1, window_start: now.toISOString(),
      })
      return false
    }

    // Increment
    const next        = row.attempts + 1
    const lockedUntil = next >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_MS).toISOString()
      : null

    await db
      .from('login_rate_limits')
      .update({ attempts: next, locked_until: lockedUntil, updated_at: now.toISOString() })
      .eq('identifier', id)

    return next >= MAX_ATTEMPTS
  } catch {
    // Never block logins on infrastructure failure
    return false
  }
}

/**
 * Resets the attempt counter after a successful login.
 */
export async function resetRateLimit(rawIdentifier: string): Promise<void> {
  try {
    const id  = await hashIdentifier(rawIdentifier)
    const db  = getClient()
    const now = new Date()
    await db
      .from('login_rate_limits')
      .update({ attempts: 0, locked_until: null, updated_at: now.toISOString() })
      .eq('identifier', id)
  } catch {
    // Non-critical — ignore
  }
}
