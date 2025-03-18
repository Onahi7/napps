'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined
  }

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      error: error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to log to an error reporting service
      console.error('Uncaught error:', error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
          <p className="mb-4 text-muted-foreground">
            Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-4 max-w-md rounded-md bg-destructive/10 p-4 text-left text-sm text-destructive">
              <pre>{this.state.error.message}</pre>
              {this.state.error.stack && (
                <pre className="mt-2 text-xs opacity-80">{this.state.error.stack}</pre>
              )}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}