/**
 * Global Error Boundary Component
 * Catches and handles all unhandled errors in the application
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler } from '@/lib/error-handler'
import { ProcessedError, ErrorContext, ErrorBoundaryState } from '@/types/errors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'

interface GlobalErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: ProcessedError, errorInfo: ErrorInfo) => void
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: ErrorHandler.handle(error, { component: 'GlobalErrorBoundary' }),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: 'GlobalErrorBoundary',
      action: 'componentDidCatch',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date(),
      additionalData: {
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

  private handleContactSupport = () => {
    if (this.state.error) {
      const supportMessage = `Error ID: ${this.state.error.id}\nError: ${this.state.error.message}\nTime: ${this.state.error.timestamp.toISOString()}`
      
      // In a real implementation, this would open a support form
      if (typeof window !== 'undefined') {
        const mailtoLink = `mailto:support@scamnepal.com?subject=Application Error&body=${encodeURIComponent(supportMessage)}`
        window.open(mailtoLink, '_blank')
      }
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl text-foreground">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Error Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Error ID:</span>
                    <span className="ml-2 font-mono text-foreground">{this.state.error.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span className="ml-2 text-foreground capitalize">{this.state.error.type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Time:</span>
                    <span className="ml-2 text-foreground">
                      {this.state.error.timestamp.toLocaleString()}
                    </span>
                  </div>
                  {this.state.retryCount > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground">Retry Count:</span>
                      <span className="ml-2 text-foreground">{this.state.retryCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Message */}
              <div className="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive font-medium">
                  {this.state.error.userMessage}
                </p>
              </div>

              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
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

              {/* Contact Support */}
              <div className="text-center">
                <Button
                  onClick={this.handleContactSupport}
                  variant="ghost"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              {/* Development Mode - Show Technical Details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-muted/30 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-foreground mb-2">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Error Stack:</h4>
                      <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Component Stack:</h4>
                      <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40">
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
