import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/nav/sidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
