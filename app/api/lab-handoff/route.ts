import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const PERF_LAB_URL = process.env.PERFORMANCE_LAB_URL ?? ''

/**
 * GET /api/lab-handoff?attemptId=<id>
 *
 * Generates a Supabase magic link and redirects the authenticated candidate
 * to the Performance Lab's auth callback, which establishes a session on the
 * Lab's domain and forwards to /exam/launch/[attemptId].
 *
 * Used by "Continue Exam →" links on CCPA cert cards where the attempt is
 * already in_progress and the Codespace may still be running.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const attemptId = request.nextUrl.searchParams.get('attemptId')

  if (!attemptId || !PERF_LAB_URL) {
    return NextResponse.redirect(new URL('/catalogue', request.url))
  }

  // Verify the attempt belongs to this user
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id')
    .eq('id', attemptId)
    .eq('candidate_id', user.id)
    .single()

  if (!attempt) {
    return NextResponse.redirect(new URL('/catalogue', request.url))
  }

  try {
    const admin = createAdminClient()
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    })

    if (!error && linkData?.properties?.hashed_token) {
      const next = encodeURIComponent(`/exam/launch/${attemptId}`)
      const url = `${PERF_LAB_URL}/api/auth/callback?token_hash=${linkData.properties.hashed_token}&next=${next}`
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('[lab-handoff] magic link generation failed:', err)
  }

  // Fallback if SUPABASE_SERVICE_ROLE_KEY not set — direct link
  return NextResponse.redirect(`${PERF_LAB_URL}/exam/launch/${attemptId}`)
}
