import { createClient } from '@/lib/supabase/server'
import { getProfile, getAttemptsForCandidate } from '@/lib/supabase/queries'
import { ProfileCard } from '@/components/portal/profile-card'
import { StatsBar } from '@/components/portal/stats-bar'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [profile, attempts] = await Promise.all([
    getProfile(supabase, user.id),
    getAttemptsForCandidate(supabase, user.id),
  ])

  const stats = [
    {
      label: 'Active Certs',
      value: attempts.filter(
        (a) =>
          a.status === 'passed' &&
          (a.expiration_date == null || new Date(a.expiration_date) > new Date()),
      ).length,
    },
    { label: 'Passed', value: attempts.filter((a) => a.status === 'passed').length },
    { label: 'Failed', value: attempts.filter((a) => a.status === 'failed').length },
    {
      label: 'Scheduled',
      value: attempts.filter((a) => ['scheduled', 'in_progress'].includes(a.status))
        .length,
    },
  ]

  const orgName =
    profile?.organizations && typeof profile.organizations === 'object'
      ? (profile.organizations as { name: string }).name
      : null

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <ProfileCard
        fullName={profile?.full_name ?? user.email ?? 'Candidate'}
        email={user.email}
        orgName={orgName}
        avatarUrl={profile?.avatar_url}
      />
      <StatsBar stats={stats} />
      <div className="flex gap-3">
        <Link
          href="/history"
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50"
        >
          View History
        </Link>
        <Link
          href="/catalogue"
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50"
        >
          Exam Catalogue
        </Link>
      </div>
    </div>
  )
}
