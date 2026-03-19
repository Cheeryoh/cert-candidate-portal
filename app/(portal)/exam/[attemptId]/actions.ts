'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitExam(attemptId: string, score: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the attempt — must belong to user and be in_progress
  const { data: attempt, error: fetchError } = await supabase
    .from('exam_attempts')
    .select('*, certifications(passing_score, validity_months)')
    .eq('id', attemptId)
    .eq('candidate_id', user.id)
    .single()

  if (fetchError || !attempt) {
    redirect('/history')
  }

  if (attempt.status !== 'in_progress') {
    redirect('/history')
  }

  const cert = attempt.certifications as {
    passing_score: number
    validity_months: number | null
  }

  const passed = score >= cert.passing_score

  // Build expiration_date as 'YYYY-MM-DD' string if passing
  let expirationDate: string | null = null
  if (passed && cert.validity_months) {
    const exp = new Date()
    exp.setMonth(exp.getMonth() + cert.validity_months)
    expirationDate = exp.toISOString().slice(0, 10)
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('exam_attempts')
    .update({
      status: passed ? 'passed' : 'failed',
      score,
      submitted_at: now,
      expiration_date: expirationDate,
    })
    .eq('id', attemptId)
    .eq('candidate_id', user.id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  redirect('/history')
}
