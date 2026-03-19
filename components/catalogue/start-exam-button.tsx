'use client'

import { useFormStatus } from 'react-dom'

export function StartExamButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 w-full rounded-md border border-transparent bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Starting…' : 'Register & Start Exam'}
    </button>
  )
}
