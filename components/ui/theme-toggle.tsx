'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors text-sidebar-foreground/55 hover:text-sidebar-foreground"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4" />
          Light mode
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          Dark mode
        </>
      )}
    </button>
  )
}
