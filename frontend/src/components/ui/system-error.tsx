/**
 * System Error Component
 * Specialized component for displaying system and critical errors
 */

import React from 'react'
import { ProcessedError } from '@/types/errors'
import { cn } from '@/lib/utils'
import { AlertTriangle, Server, Database, Cpu, HardDrive, Wifi, RefreshCw, Home, MessageCircle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { createSupportMailto } from '@/lib/config'

interface SystemErrorProps {
  error: ProcessedError
  variant?: 'inline' | 'card' | 'modal'
  showRetryButton?: boolean
  onRetry?: () => void
  onGoHome?: () => void
  onContactSupport?: () => void
  className?: string
}

export function SystemError({ 
  error, 
  variant = 'card',
  showRetryButton = true,
  onRetry,
  onGoHome,
  onContactSupport,
  className 
}: SystemErrorProps) {
  const getSystemIcon = () => {
    // Determine icon based on error context or message
    const message = error.message.toLowerCase()
    
    if (message.includes('database') || message.includes('db')) {
      return Database
    } else if (message.includes('server') || message.includes('api')) {
      return Server
    } else if (message.includes('memory') || message.includes('cpu')) {
      return Cpu
    } else if (message.includes('storage') || message.includes('disk')) {
      return HardDrive
    } else if (message.includes('network') || message.includes('connection')) {
      return Wifi
    } else {
      return AlertTriangle
    }
  }

  const getSystemMessage = () => {
    switch (error.severity) {
      case 'critical':
        return 'A critical system error has occurred. Our team has been notified and is working to resolve this issue.'
      case 'high':
        return 'A system error has occurred that may affect some functionality. Please try again or contact support if the problem persists.'
      default:
        return error.userMessage
    }
  }

  const getRecoveryActions = () => {
    const actions = []

    // Always provide basic recovery actions
    if (showRetryButton && onRetry) {
      actions.push({
        label: 'Try Again',
        action: onRetry,
        primary: true
      })
    }

    actions.push({
      label: 'Refresh Page',
      action: () => window.location.reload()
    })

    if (onGoHome) {
      actions.push({
        label: 'Go Home',
        action: onGoHome
      })
    } else {
      actions.push({
        label: 'Go Home',
        action: () => window.location.href = '/'
      })
    }

    // Always provide support contact for system errors
    if (onContactSupport) {
      actions.push({
        label: 'Contact Support',
        action: onContactSupport
      })
    } else {
      actions.push({
        label: 'Contact Support',
        action: () => {
          const subject = 'System Error Report'
          const body = [
            'I encountered a system error while using the application.',
            '',
            'Error Details:',
            `Error ID: ${error.id}`,
            `Error Type: ${error.type}`,
            `Severity: ${error.severity}`,
            `Message: ${error.message}`,
            `Time: ${error.timestamp.toISOString()}`,
            `URL: ${window.location.href}`,
            '',
            'Please provide any additional details:',
            '',
            'Thank you for your assistance.'
          ].join('\n')

          const mailtoLink = createSupportMailto(subject, body, 'support')
          window.open(mailtoLink, '_blank')
        }
      })
    }

    return actions
  }

  const Icon = getSystemIcon()
  const actions = getRecoveryActions()

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive">
          {getSystemMessage()}
        </p>
        {actions.length > 0 && (
          <Button
            onClick={actions[0].action}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            {actions[0].label}
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm", className)}>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Icon className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              System Error
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {getSystemMessage()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Details */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error ID:</span>
                  <span className="font-mono text-foreground">{error.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity:</span>
                  <span className="text-foreground capitalize">{error.severity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="text-foreground">
                    {error.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="space-y-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.primary ? 'default' : 'outline'}
                  className="w-full"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={cn("border-destructive/20 bg-destructive-muted", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg text-destructive">
            System Error
          </CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          {getSystemMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Details */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error ID:</span>
              <span className="font-mono text-foreground">{error.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground capitalize">{error.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severity:</span>
              <span className="text-foreground capitalize">{error.severity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="text-foreground">
                {error.timestamp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant={action.primary ? 'default' : 'outline'}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* System Status Notice */}
        <div className="bg-background/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Server className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">System Status</p>
              <p>Our technical team has been automatically notified of this error and is working to resolve it. If the problem persists, please contact support with the error ID above.</p>
            </div>
          </div>
        </div>

        {/* Development Mode - Show Technical Details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="bg-background/20 rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
              Technical Details (Development Mode)
            </summary>
            <div className="space-y-2">
              <div>
                <h4 className="text-xs font-medium text-foreground mb-1">Error Message:</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                  {error.message}
                </pre>
              </div>
              {error.technicalMessage && (
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">Technical Details:</h4>
                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                    {error.technicalMessage}
                  </pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">Stack Trace:</h4>
                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

// System status indicator component
interface SystemStatusProps {
  isHealthy: boolean
  lastCheck?: Date
  className?: string
}

export function SystemStatus({ isHealthy, lastCheck, className }: SystemStatusProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isHealthy ? "bg-success" : "bg-destructive"
      )} />
      <span className="text-xs text-muted-foreground">
        System {isHealthy ? 'Healthy' : 'Issues Detected'}
      </span>
      {lastCheck && (
        <span className="text-xs text-muted-foreground">
          (Last check: {lastCheck.toLocaleTimeString()})
        </span>
      )}
    </div>
  )
}
