import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatScore } from '@/lib/utils'

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  passed: 'default',
  failed: 'destructive',
  scheduled: 'secondary',
  in_progress: 'secondary',
  cancelled: 'outline',
}

const STATUS_CLASS: Record<string, string> = {
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

interface Attempt {
  id: string
  attempt_number: number
  status: string
  score: number | null
  submitted_at: string | null
  expiration_date: string | null
  reeligibility_date: string | null
  certifications: {
    code: string
    name: string
    category: string
  } | null
}

export function AttemptsTable({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No exam attempts yet.
      </p>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Certification</TableHead>
            <TableHead>Attempt #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Re-eligible</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">
                    {a.certifications?.code ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.certifications?.name}</p>
                </div>
              </TableCell>
              <TableCell>{a.attempt_number}</TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_VARIANT[a.status] ?? 'outline'}
                  className={STATUS_CLASS[a.status] ?? ''}
                >
                  {a.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{formatScore(a.score)}</TableCell>
              <TableCell>{formatDate(a.submitted_at)}</TableCell>
              <TableCell>{formatDate(a.expiration_date)}</TableCell>
              <TableCell>{formatDate(a.reeligibility_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
