'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Creates a new in_progress exam attempt for the current user.
 *
 * - Attempt number is sequential: MAX(existing) + 1 per candidate+cert pair.
 * - No concurrent-attempt restriction in demo mode — any eligible candidate
 *   (prerequisites met, enforced by DB trigger) can start as many attempts
 *   as they like.
 * - On success, redirects to /exam/<attemptId> so the candidate can take the exam.
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

  // Determine the next sequential attempt number for this candidate + cert
  const { data: latest } = await supabase
    .from('exam_attempts')
    .select('attempt_number')
    .eq('candidate_id', user.id)
    .eq('certification_id', certificationId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextAttempt = (latest?.attempt_number ?? 0) + 1

  const { data: newAttempt, error } = await supabase
    .from('exam_attempts')
    .insert({
      candidate_id: user.id,
      certification_id: certificationId,
      attempt_number: nextAttempt,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    // Unique constraint race: another tab registered simultaneously — retry
    if (error.code === '23505') {
      const { data: retryLatest } = await supabase
        .from('exam_attempts')
        .select('attempt_number')
        .eq('candidate_id', user.id)
        .eq('certification_id', certificationId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const retryAttemptNum = (retryLatest?.attempt_number ?? 0) + 1

      const { data: retryAttempt } = await supabase
        .from('exam_attempts')
        .insert({
          candidate_id: user.id,
          certification_id: certificationId,
          attempt_number: retryAttemptNum,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      redirect(`/exam/${retryAttempt!.id}`)
    } else {
      throw new Error(error.message)
    }
  }

  redirect(`/exam/${newAttempt!.id}`)
}
