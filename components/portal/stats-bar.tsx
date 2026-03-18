import { Card, CardContent } from '@/components/ui/card'

interface Stat {
  label: string
  value: number
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
