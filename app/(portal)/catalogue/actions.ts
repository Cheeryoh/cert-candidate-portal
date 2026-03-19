'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Cert codes that launch the Performance Lab instead of the MCQ exam. */
const PERF_LAB_CODES = new Set(['CCPA-101', 'CCPA-201'])

/**
 * Creates a new exam attempt for the current user and routes them to the
 * correct exam environment:
 *
 *  - CCPA-101 / CCPA-201 → /api/lab-handoff (portal-internal route that
 *    generates a Supabase magic link and hands off to the Performance Lab)
 *    Attempt created as 'scheduled'; Performance Lab transitions to 'in_progress'.
 *
 *  - All other certs → /exam/[id] (MCQ exam inside this portal)
 *    Attempt created as 'in_progress' immediately.
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

  // Determine cert type
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

  // For lab certs: redirect to the portal's own API route which generates the
  // magic link and issues an external redirect to the Performance Lab.
  // redirect() only supports same-origin in server actions — the API route
  // handles the cross-domain hop via NextResponse.redirect.
  if (isLabCert) {
    redirect(`/api/lab-handoff?attemptId=${attemptId}`)
  }

  redirect(`/exam/${attemptId}`)
}
