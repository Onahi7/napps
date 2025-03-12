'use client'

import { useEffect } from 'react'
import { Icons } from '@/components/icons'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <Icons.warning className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-2xl font-semibold">Something went wrong!</h2>
      <p className="mb-4 max-w-md text-muted-foreground">
        We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Go home
        </a>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 max-w-md rounded-md bg-destructive/10 p-4 text-left text-sm text-destructive">
          <pre>{error.message}</pre>
        </div>
      )}
    </div>
  )
}