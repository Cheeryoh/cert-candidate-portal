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
          <AvatarFallback className="bg-muted text-foreground text-lg font-semibold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold text-foreground">{fullName}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
          {orgName && (
            <p className="text-sm text-muted-foreground">{orgName}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
