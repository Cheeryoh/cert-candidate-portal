interface AnthropicLogoProps {
  className?: string
}

export function AnthropicLogo({ className }: AnthropicLogoProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
      aria-label="ANTHROP\C"
    >
      ANTHROP\C
    </span>
  )
}
