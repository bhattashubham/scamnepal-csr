/**
 * Route Error Boundary Component
 * Catches and handles errors within specific routes/pages
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler } from '@/lib/error-handler'
import { ProcessedError, ErrorContext, ErrorBoundaryState } from '@/types/errors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RouteErrorBoundaryProps {
  children: ReactNode
  routeName?: string
  fallback?: ReactNode
  onError?: (error: ProcessedError, errorInfo: ErrorInfo) => void
  onRetry?: () => void
  showNavigation?: boolean
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: ErrorHandler.handle(error, { component: 'RouteErrorBoundary' }),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: 'RouteErrorBoundary',
      action: 'componentDidCatch',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date(),
      additionalData: {
        routeName: this.props.routeName,
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

  private handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default route error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl text-foreground">
                Page Error
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {this.props.routeName ? `${this.props.routeName} page encountered an error` : 'This page encountered an error'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="bg-destructive-muted border border-destructive/20 rounded-lg p-3">
                <p className="text-destructive font-medium text-sm">
                  {this.state.error.userMessage}
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error ID:</span>
                    <span className="font-mono text-foreground">{this.state.error.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground capitalize">{this.state.error.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="text-foreground">
                      {this.state.error.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {this.state.retryCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retry Count:</span>
                      <span className="text-foreground">{this.state.retryCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recovery Actions */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleRefresh}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>

                {/* Navigation Actions */}
                {this.props.showNavigation !== false && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={this.handleGoBack}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                    
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex-1"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </div>
                )}
              </div>

              {/* Development Mode - Show Technical Details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-muted/30 rounded-lg p-3">
                  <summary className="cursor-pointer font-medium text-foreground mb-2">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Error Stack:</h4>
                      <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Component Stack:</h4>
                      <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
