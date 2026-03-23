import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { BRANDING } from "@/config/branding"

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground"
          data-testid="error-boundary-fallback"
          role="alert"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {BRANDING.shortName}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            {this.state.error?.message ? (
              <p className="max-w-md text-sm text-muted-foreground">
                {this.state.error.message}
              </p>
            ) : null}
          </div>
          <Button type="button" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
