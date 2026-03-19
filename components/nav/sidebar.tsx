'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { AnthropicLogo } from '@/components/brand/anthropic-logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useBrand } from '@/components/brand/brand-context'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/catalogue', label: 'Catalogue' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { name: brandName, isDefault: isDefaultBrand } = useBrand()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-56 flex-col px-3 py-6 bg-sidebar border-r border-sidebar-border">
      <div className="mb-6 px-2">
        <Link href="/dashboard">
          <AnthropicLogo className="w-28 text-sidebar-foreground opacity-90 transition-opacity hover:opacity-100" />
        </Link>
      </div>
      <Separator className="mb-4 bg-sidebar-border" />
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'border-l-2 pl-[10px] text-sidebar-foreground border-sidebar-primary bg-sidebar-accent'
                : 'text-sidebar-foreground/55 hover:text-sidebar-foreground',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Separator className="mb-4 bg-sidebar-border" />
      <a
        href="https://anthropic.skilljar.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 rounded px-3 py-2 text-sm transition-colors text-sidebar-foreground/55 hover:text-sidebar-foreground"
      >
        {isDefaultBrand ? 'Anthropic Academy' : `${brandName} Academy`} →
      </a>
      <ThemeToggle />
      <button
        className="rounded px-3 py-2 text-left text-sm transition-colors text-sidebar-foreground/55 hover:text-sidebar-foreground"
        onClick={handleSignOut}
      >
        Sign out
      </button>
    </aside>
  )
}
