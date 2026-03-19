import type { SupabaseClient } from '@supabase/supabase-js'

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function getEligibilityForCandidate(
  supabase: SupabaseClient,
  candidateId: string,
) {
  const { data, error } = await supabase
    .from('candidate_eligibility')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAttemptsForCandidate(
  supabase: SupabaseClient,
  candidateId: string,
) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*, certifications(code, name, category)')
    .eq('candidate_id', candidateId)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllCertifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getOrganization(
  supabase: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()
  if (error) throw error
  return data
}

export async function getAttemptById(
  supabase: SupabaseClient,
  attemptId: string,
  candidateId: string,
) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*, certifications(id, code, name, category, passing_score, time_limit_minutes, validity_months)')
    .eq('id', attemptId)
    .eq('candidate_id', candidateId)
    .single()
  if (error) throw error
  return data
}
