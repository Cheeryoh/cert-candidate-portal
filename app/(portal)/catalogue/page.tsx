import { createClient } from '@/lib/supabase/server'
import { getEligibilityForCandidate } from '@/lib/supabase/queries'
import { CertCard } from '@/components/catalogue/cert-card'

export default async function CataloguePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const eligibility = await getEligibilityForCandidate(supabase, user.id)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Exam Catalogue</h1>
        <p className="text-sm text-zinc-500 mt-1">
          All available certifications and your eligibility status
        </p>
      </div>
      {eligibility.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">
          No certifications available.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {eligibility.map((cert) => (
            <CertCard
              key={cert.certification_id}
              code={cert.code}
              name={cert.name}
              category={cert.category}
              passingScore={cert.passing_score}
              prerequisites_met={cert.prerequisites_met}
              is_certified={cert.is_certified}
              latest_attempt={cert.latest_attempt as Parameters<typeof CertCard>[0]['latest_attempt']}
            />
          ))}
        </div>
      )}
    </div>
  )
}
