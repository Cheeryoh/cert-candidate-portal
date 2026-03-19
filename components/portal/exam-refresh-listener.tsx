'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Listens for postMessage events from the exam tab.
 * When the exam tab submits, it posts { type: 'exam-submitted' } to window.opener.
 * We respond by calling router.refresh() to re-fetch server data,
 * which clears the in-progress attempt badge without a manual page reload.
 */
export function ExamRefreshListener() {
  const router = useRouter()

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'exam-submitted') {
        router.refresh()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  return null
}
