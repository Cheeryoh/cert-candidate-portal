/**
 * PageError — shown by portal server pages when a data-fetching query throws.
 * Keeps the portal layout intact so the sidebar remains navigable.
 */
export function PageError({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-destructive">
        {message ?? 'Something went wrong loading this page.'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try refreshing, or sign out and back in.
      </p>
    </div>
  )
}
