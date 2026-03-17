import { createClient } from '@/lib/supabase/server'
import { getAttemptsForCandidate } from '@/lib/supabase/queries'
import { AttemptsTable } from '@/components/history/attempts-table'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const attempts = await getAttemptsForCandidate(supabase, user.id)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Exam History</h1>
        <p className="text-sm text-zinc-500 mt-1">All your exam attempts</p>
      </div>
      <AttemptsTable attempts={attempts} />
    </div>
  )
}
