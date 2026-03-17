'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/catalogue', label: 'Catalogue' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-200 bg-white px-3 py-6">
      <div className="mb-6 px-2">
        <span className="text-sm font-semibold tracking-tight text-zinc-900">
          Cert Portal
        </span>
      </div>
      <Separator className="mb-4" />
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Separator className="mb-4" />
      <button
        className="rounded-md px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        onClick={handleSignOut}
      >
        Sign out
      </button>
    </aside>
  )
}
