'use client'

import { useBrand } from './brand-context'

interface AnthropicLogoProps {
  className?: string
}

export function AnthropicLogo({ className }: AnthropicLogoProps) {
  const { name, isDefault } = useBrand()
  return (
    <span
      className={className}
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: isDefault ? '0.18em' : '0.02em',
        textTransform: isDefault ? 'uppercase' : 'none',
        whiteSpace: 'nowrap',
      }}
      aria-label={name}
    >
      {name}
    </span>
  )
}
