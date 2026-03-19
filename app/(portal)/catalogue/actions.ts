'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/** Cert codes that launch the Performance Lab instead of the MCQ exam. */
const PERF_LAB_CODES = new Set(['CCPA-101', 'CCPA-201'])

const PERF_LAB_URL = process.env.PERFORMANCE_LAB_URL ?? ''

/**
 * Creates a new exam attempt for the current user and routes them to the
 * correct exam environment:
 *
 *  - CCPA-101 / CCPA-201 → Performance Lab (GitHub Codespace, 4D rubric)
 *    Attempt starts as 'scheduled'; Performance Lab transitions to 'in_progress'
 *    on Codespace provisioning. Auth is handed off via a Supabase magic link
 *    so the candidate's session is valid on the Performance Lab domain.
 *
 *  - All other certs → MCQ exam inside this portal (/exam/[id])
 *    Attempt starts as 'in_progress' immediately.
 *
 * Demo mode: concurrent attempts are allowed (no in-progress guard).
 */
export async function registerAndStartExam(
  certificationId: string,
  _formData: FormData,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Determine cert type — one query, no extra round-trip later
  const { data: cert } = await supabase
    .from('certifications')
    .select('code')
    .eq('id', certificationId)
    .single()

  const isLabCert = cert ? PERF_LAB_CODES.has(cert.code) : false

  // Performance Lab manages the in_progress transition itself; portal
  // creates the row as 'scheduled' so the Lab's /api/exam/start accepts it.
  const initialStatus = isLabCert ? 'scheduled' : 'in_progress'

  // Sequential attempt number for this candidate + cert
  const { data: latest } = await supabase
    .from('exam_attempts')
    .select('attempt_number')
    .eq('candidate_id', user.id)
    .eq('certification_id', certificationId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextAttempt = (latest?.attempt_number ?? 0) + 1

  const basePayload = {
    candidate_id: user.id,
    certification_id: certificationId,
    attempt_number: nextAttempt,
    status: initialStatus,
    // MCQ exams start immediately; Lab exams get started_at set by the Lab
    ...(isLabCert ? {} : { started_at: new Date().toISOString() }),
  }

  const { data: newAttempt, error } = await supabase
    .from('exam_attempts')
    .insert(basePayload)
    .select('id')
    .single()

  let attemptId: string

  if (error) {
    if (error.code === '23505') {
      // Unique constraint race — re-read max and retry once
      const { data: retryLatest } = await supabase
        .from('exam_attempts')
        .select('attempt_number')
        .eq('candidate_id', user.id)
        .eq('certification_id', certificationId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: retryAttempt } = await supabase
        .from('exam_attempts')
        .insert({
          ...basePayload,
          attempt_number: (retryLatest?.attempt_number ?? 0) + 1,
        })
        .select('id')
        .single()

      attemptId = retryAttempt!.id
    } else {
      throw new Error(error.message)
    }
  } else {
    attemptId = newAttempt!.id
  }

  if (isLabCert) {
    await redirectToLab(user.email!, attemptId)
  }

  redirect(`/exam/${attemptId}`)
}

/**
 * Generates a Supabase magic link and redirects the user to the Performance
 * Lab's auth callback, which sets a session cookie on the Lab's domain and
 * forwards to /exam/launch/[attemptId].
 *
 * Requires in Vercel (portal project):
 *   PERFORMANCE_LAB_URL      = https://performance-lab-zeta.vercel.app
 *   SUPABASE_SERVICE_ROLE_KEY = <shared service role key>
 */
async function redirectToLab(email: string, attemptId: string): Promise<never> {
  const labUrl = PERF_LAB_URL

  if (!labUrl) {
    throw new Error(
      'PERFORMANCE_LAB_URL is not set. Add it to Vercel environment variables for the candidate portal.',
    )
  }

  try {
    const admin = createAdminClient()
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (!error && linkData?.properties?.hashed_token) {
      const next = encodeURIComponent(`/exam/launch/${attemptId}`)
      redirect(
        `${labUrl}/api/auth/callback?token_hash=${linkData.properties.hashed_token}&next=${next}`,
      )
    }
  } catch (err) {
    // Re-throw Next.js redirect signals — never swallow them
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err
    // createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY is missing.
    // Fall through to direct redirect below (candidate lands on Lab login).
    console.error('[redirectToLab] magic link generation failed:', err)
  }

  // Fallback: direct link without auth handoff. The Lab will redirect to
  // portal login if the candidate has no session on the Lab domain.
  redirect(`${labUrl}/exam/launch/${attemptId}`)
}
