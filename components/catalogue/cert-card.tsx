import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface LatestAttempt {
  status: string
  score: number | null
  submitted_at: string | null
  expiration_date: string | null
  reeligibility_date: string | null
  attempt_number: number
}

interface CertCardProps {
  code: string
  name: string
  category: string
  passingScore: number
  prerequisites_met: boolean
  is_certified: boolean
  latest_attempt: LatestAttempt | null
}

export function CertCard({
  code,
  name,
  category,
  passingScore,
  prerequisites_met,
  is_certified,
  latest_attempt,
}: CertCardProps) {
  function eligibilityBadge() {
    if (is_certified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Certified · expires {formatDate(latest_attempt?.expiration_date)}
        </Badge>
      )
    }
    if (!prerequisites_met) {
      return (
        <Badge
          variant="outline"
          className="bg-zinc-50 text-zinc-500 border-zinc-300"
          title="Prerequisites not met"
        >
          Not Eligible
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        Eligible
      </Badge>
    )
  }

  function latestAttemptBadge() {
    if (!latest_attempt) return null
    const cls: Record<string, string> = {
      passed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    }
    return (
      <Badge className={cls[latest_attempt.status] ?? ''} variant="outline">
        Last: {latest_attempt.status.replace('_', ' ')}
        {latest_attempt.score != null && ` · ${latest_attempt.score}%`}
      </Badge>
    )
  }

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-zinc-400">{code}</p>
            <CardTitle className="text-base leading-snug">{name}</CardTitle>
          </div>
          {eligibilityBadge()}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{category}</Badge>
          <Badge variant="outline">Pass ≥ {passingScore}%</Badge>
        </div>
        {latestAttemptBadge()}
        {!prerequisites_met && (
          <p className="text-xs text-zinc-400">
            Complete prerequisite certification(s) to become eligible.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
