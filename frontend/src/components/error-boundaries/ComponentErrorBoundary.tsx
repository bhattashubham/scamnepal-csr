/**
 * Component Error Boundary
 * Catches and handles errors within individual components
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler } from '@/lib/error-handler'
import { ProcessedError, ErrorContext, ErrorBoundaryState } from '@/types/errors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface ComponentErrorBoundaryProps {
  children: ReactNode
  componentName?: string
  fallback?: ReactNode
  onError?: (error: ProcessedError, errorInfo: ErrorInfo) => void
  onRetry?: () => void
  showRetryButton?: boolean
  showDismissButton?: boolean
  onDismiss?: () => void
}

export class ComponentErrorBoundary extends Component<ComponentErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: ErrorHandler.handle(error, { component: 'ComponentErrorBoundary' }),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: 'ComponentErrorBoundary',
      action: 'componentDidCatch',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date(),
      additionalData: {
        componentName: this.props.componentName,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      }
    }

    const processedError = ErrorHandler.handle(error, context)
    
    this.setState({
      error: processedError,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(processedError, errorInfo)
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      lastRetry: new Date(),
    }))

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    })

    // Call custom dismiss handler if provided
    if (this.props.onDismiss) {
      this.props.onDismiss()
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default component error UI
      return (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive-muted">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <p className="font-medium">
                {this.props.componentName ? `${this.props.componentName} component error` : 'Component error'}
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {this.state.error.userMessage}
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-background/30 rounded p-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error ID:</span>
                  <span className="font-mono text-foreground">{this.state.error.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground capitalize">{this.state.error.type.replace('_', ' ')}</span>
                </div>
                {this.state.retryCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retry Count:</span>
                    <span className="text-foreground">{this.state.retryCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {this.props.showRetryButton !== false && (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              
              {this.props.showDismissButton && (
                <Button
                  onClick={this.handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              )}
            </div>

            {/* Development Mode - Show Technical Details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="bg-background/20 rounded p-2">
                <summary className="cursor-pointer text-xs font-medium text-foreground mb-1">
                  Technical Details (Development Mode)
                </summary>
                <div className="space-y-2 mt-2">
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">Error Stack:</h4>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-24">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">Component Stack:</h4>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-24">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}
