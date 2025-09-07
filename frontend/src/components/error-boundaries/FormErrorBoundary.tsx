/**
 * Form Error Boundary Component
 * Catches and handles errors within form components
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler } from '@/lib/error-handler'
import { ProcessedError, ErrorContext, ErrorBoundaryState } from '@/types/errors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Save, X } from 'lucide-react'

interface FormErrorBoundaryProps {
  children: ReactNode
  formName?: string
  onError?: (error: ProcessedError, errorInfo: ErrorInfo) => void
  onRetry?: () => void
  onReset?: () => void
  fallback?: ReactNode
}

export class FormErrorBoundary extends Component<FormErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: ErrorHandler.handle(error, { component: 'FormErrorBoundary' }),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: 'FormErrorBoundary',
      action: 'componentDidCatch',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date(),
      additionalData: {
        formName: this.props.formName,
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

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    })

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default form error UI
      return (
        <Card className="border-destructive/20 bg-destructive-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg text-destructive">
                Form Error
              </CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              {this.props.formName ? `${this.props.formName} form encountered an error` : 'This form encountered an error'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Message */}
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-sm text-foreground">
                {this.state.error.userMessage}
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-background/30 rounded-lg p-3">
              <div className="space-y-1 text-xs">
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

            {/* Recovery Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleRetry}
                size="sm"
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Form
              </Button>
              
              <Button
                onClick={this.handleReset}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
            </div>

            {/* Development Mode - Show Technical Details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="bg-background/20 rounded-lg p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
                  Technical Details (Development Mode)
                </summary>
                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">Error Stack:</h4>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">Component Stack:</h4>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
