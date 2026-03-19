import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAttemptById } from '@/lib/supabase/queries'
import { ExamContent } from '@/components/exam/exam-content'

interface ExamPageProps {
  params: Promise<{ attemptId: string }>
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { attemptId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let attempt
  try {
    attempt = await getAttemptById(supabase, attemptId, user.id)
  } catch {
    redirect('/history')
  }

  if (!attempt || attempt.status !== 'in_progress') {
    redirect('/history')
  }

  const cert = attempt.certifications as {
    id: string
    code: string
    name: string
    category: string
    passing_score: number
    time_limit_minutes: number | null
    validity_months: number | null
  }

  return (
    <ExamContent
      attemptId={attempt.id}
      attemptNumber={attempt.attempt_number}
      startedAt={attempt.started_at}
      certName={cert.name}
      certCode={cert.code}
      passingScore={cert.passing_score}
    />
  )
}
