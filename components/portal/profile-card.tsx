import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials } from '@/lib/utils'

interface ProfileCardProps {
  fullName: string
  email?: string
  orgName?: string | null
  avatarUrl?: string | null
}

export function ProfileCard({ fullName, email, orgName, avatarUrl }: ProfileCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-14 w-14">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
          <AvatarFallback className="bg-zinc-200 text-zinc-700 text-lg font-semibold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold text-zinc-900">{fullName}</p>
          {email && <p className="text-sm text-zinc-500">{email}</p>}
          {orgName && (
            <p className="text-sm text-zinc-400">{orgName}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
