/**
 * Authentication Error Component
 * Specialized component for displaying authentication and authorization errors
 */

import React from 'react'
import { ProcessedError, AuthError as AuthErrorType } from '@/types/errors'
import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, Lock, Clock, UserX, Mail, Key } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface AuthErrorProps {
  error: ProcessedError | AuthErrorType
  variant?: 'inline' | 'card' | 'modal'
  showRetryButton?: boolean
  onRetry?: () => void
  onLogin?: () => void
  onLogout?: () => void
  className?: string
}

export function AuthError({ 
  error, 
  variant = 'card',
  showRetryButton = true,
  onRetry,
  onLogin,
  onLogout,
  className 
}: AuthErrorProps) {
  // Handle both ProcessedError and AuthErrorType
  const message = 'message' in error ? error.message : (error as ProcessedError).userMessage
  const authType = 'type' in error ? error.type : undefined
  const retryAfter = 'retryAfter' in error ? error.retryAfter : undefined

  const getAuthIcon = () => {
    switch (authType) {
      case 'token_expired':
      case 'session_expired':
        return Clock
      case 'invalid_credentials':
        return UserX
      case 'account_locked':
        return Lock
      case 'email_not_verified':
        return Mail
      case 'otp_expired':
      case 'otp_invalid':
        return Key
      default:
        return ShieldAlert
    }
  }

  const getAuthMessage = () => {
    switch (authType) {
      case 'token_expired':
      case 'session_expired':
        return 'Your session has expired. Please log in again to continue.'
      case 'invalid_credentials':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'account_locked':
        return 'Your account has been temporarily locked due to multiple failed login attempts.'
      case 'email_not_verified':
        return 'Please verify your email address before logging in.'
      case 'otp_expired':
        return 'The verification code has expired. Please request a new one.'
      case 'otp_invalid':
        return 'Invalid verification code. Please check the code and try again.'
      default:
        return message
    }
  }

  const getRecoveryActions = () => {
    const actions = []

    switch (authType) {
      case 'token_expired':
      case 'session_expired':
        actions.push({
          label: 'Log In Again',
          action: onLogin || (() => window.location.href = '/auth'),
          primary: true
        })
        break
      case 'invalid_credentials':
        actions.push({
          label: 'Try Again',
          action: onRetry || (() => {}),
          primary: true
        })
        actions.push({
          label: 'Forgot Password?',
          action: () => window.location.href = '/auth?mode=forgot-password'
        })
        break
      case 'account_locked':
        if (retryAfter) {
          actions.push({
            label: `Try Again in ${Math.ceil(retryAfter / 60)} minutes`,
            action: () => {},
            disabled: true
          })
        } else {
          actions.push({
            label: 'Contact Support',
            action: () => window.location.href = '/support'
          })
        }
        break
      case 'email_not_verified':
        actions.push({
          label: 'Resend Verification Email',
          action: onRetry || (() => {}),
          primary: true
        })
        actions.push({
          label: 'Contact Support',
          action: () => window.location.href = '/support'
        })
        break
      case 'otp_expired':
      case 'otp_invalid':
        actions.push({
          label: 'Request New Code',
          action: onRetry || (() => {}),
          primary: true
        })
        break
      default:
        if (showRetryButton && onRetry) {
          actions.push({
            label: 'Try Again',
            action: onRetry,
            primary: true
          })
        }
        actions.push({
          label: 'Log Out',
          action: onLogout || (() => {
            localStorage.removeItem('token')
            window.location.href = '/auth'
          })
        })
    }

    return actions
  }

  const Icon = getAuthIcon()
  const actions = getRecoveryActions()

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive">
          {getAuthMessage()}
        </p>
        {actions.length > 0 && (
          <Button
            onClick={actions[0].action}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            disabled={actions[0].disabled}
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Icon className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {getAuthMessage()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Details */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error Type:</span>
                  <span className="text-foreground capitalize">
                    {authType?.replace('_', ' ') || 'Authentication Error'}
                  </span>
                </div>
                {retryAfter && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retry After:</span>
                    <span className="text-foreground">
                      {Math.ceil(retryAfter / 60)} minutes
                    </span>
                  </div>
                )}
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
                  disabled={action.disabled}
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
            Authentication Error
          </CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          {getAuthMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Details */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Type:</span>
              <span className="text-foreground capitalize">
                {authType?.replace('_', ' ') || 'Authentication Error'}
              </span>
            </div>
            {retryAfter && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retry After:</span>
                <span className="text-foreground">
                  {Math.ceil(retryAfter / 60)} minutes
                </span>
              </div>
            )}
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
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* Security Notice */}
        <div className="bg-background/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Security Notice</p>
              <p>If you continue to experience authentication issues, please contact our support team for assistance.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Session expired component
interface SessionExpiredProps {
  onLogin?: () => void
  className?: string
}

export function SessionExpired({ onLogin, className }: SessionExpiredProps) {
  return (
    <AuthError
      error={{
        type: 'session_expired',
        message: 'Your session has expired. Please log in again to continue.'
      }}
      variant="modal"
      onLogin={onLogin}
      className={className}
    />
  )
}

// Login failed component
interface LoginFailedProps {
  onRetry?: () => void
  onForgotPassword?: () => void
  className?: string
}

export function LoginFailed({ onRetry, onForgotPassword, className }: LoginFailedProps) {
  return (
    <AuthError
      error={{
        type: 'invalid_credentials',
        message: 'Invalid email or password. Please check your credentials and try again.'
      }}
      variant="card"
      onRetry={onRetry}
      className={className}
    />
  )
}
