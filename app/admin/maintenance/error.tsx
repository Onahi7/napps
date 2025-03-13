'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function MaintenanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto p-6">
      <Card className="p-6 border-destructive">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Database Error</h2>
          <p className="text-muted-foreground max-w-[500px]">
            {error.message || 'An error occurred while accessing the database. This could be due to maintenance or connection issues.'}
          </p>
          <div className="flex gap-4">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}