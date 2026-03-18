import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAttemptsForCandidate } from '@/lib/supabase/queries'
import { AttemptsTable } from '@/components/history/attempts-table'
import { PageError } from '@/components/ui/page-error'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let attempts
  try {
    attempts = await getAttemptsForCandidate(supabase, user.id)
  } catch {
    return <PageError />
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exam History</h1>
        <p className="text-sm text-muted-foreground mt-1">All your exam attempts</p>
      </div>
      <AttemptsTable attempts={attempts} />
    </div>
  )
}
