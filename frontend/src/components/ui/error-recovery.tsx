/**
 * Error Recovery Components
 * Components for handling error recovery actions
 */

import React from 'react'
import { RecoveryAction, RecoveryActionType } from '@/types/errors'
import { cn } from '@/lib/utils'
import { RefreshCw, Home, MessageCircle, Bug, ArrowLeft, Trash2, LogOut, RotateCcw } from 'lucide-react'
import { Button } from './button'
import { createSupportMailto } from '@/lib/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface RetryButtonProps {
  onRetry: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function RetryButton({ 
  onRetry, 
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  variant = 'default',
  size = 'default',
  className 
}: RetryButtonProps) {
  const canRetry = retryCount < maxRetries
  const isDisabled = !canRetry || isRetrying

  return (
    <Button
      onClick={onRetry}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      {isRetrying ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryCount > 0 ? `Retry (${retryCount}/${maxRetries})` : 'Retry'}
        </>
      )}
    </Button>
  )
}

interface RefreshButtonProps {
  onRefresh?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function RefreshButton({ 
  onRefresh, 
  variant = 'outline',
  size = 'default',
  className 
}: RefreshButtonProps) {
  const handleRefresh = onRefresh || (() => window.location.reload())

  return (
    <Button
      onClick={handleRefresh}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  )
}

interface ContactSupportProps {
  errorId?: string
  errorMessage?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function ContactSupport({ 
  errorId,
  errorMessage,
  variant = 'outline',
  size = 'default',
  className 
}: ContactSupportProps) {
  const handleContactSupport = () => {
    const subject = 'Support Request - Application Error'
    const body = [
      'I encountered an error while using the application.',
      '',
      'Error Details:',
      errorId ? `Error ID: ${errorId}` : '',
      errorMessage ? `Error Message: ${errorMessage}` : '',
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      '',
      'Please provide any additional details or steps to reproduce the issue:',
      '',
      'Thank you for your assistance.'
    ].filter(Boolean).join('\n')

    const mailtoLink = createSupportMailto(subject, body, 'support')
    window.open(mailtoLink, '_blank')
  }

  return (
    <Button
      onClick={handleContactSupport}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Contact Support
    </Button>
  )
}

interface ReportIssueProps {
  errorId?: string
  errorMessage?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function ReportIssue({ 
  errorId,
  errorMessage,
  variant = 'ghost',
  size = 'default',
  className 
}: ReportIssueProps) {
  const handleReportIssue = () => {
    const subject = 'Bug Report - Application Error'
    const body = [
      'I found a bug in the application.',
      '',
      'Error Details:',
      errorId ? `Error ID: ${errorId}` : '',
      errorMessage ? `Error Message: ${errorMessage}` : '',
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      'Steps to reproduce:',
      '1. ',
      '2. ',
      '3. ',
      '',
      'Expected behavior:',
      '',
      'Actual behavior:',
      '',
      'Additional information:',
      ''
    ].filter(Boolean).join('\n')

    const mailtoLink = createSupportMailto(subject, body, 'bugs')
    window.open(mailtoLink, '_blank')
  }

  return (
    <Button
      onClick={handleReportIssue}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <Bug className="h-4 w-4 mr-2" />
      Report Issue
    </Button>
  )
}

interface GoBackButtonProps {
  onGoBack?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function GoBackButton({ 
  onGoBack, 
  variant = 'outline',
  size = 'default',
  className 
}: GoBackButtonProps) {
  const handleGoBack = onGoBack || (() => window.history.back())

  return (
    <Button
      onClick={handleGoBack}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Go Back
    </Button>
  )
}

interface GoHomeButtonProps {
  onGoHome?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function GoHomeButton({ 
  onGoHome, 
  variant = 'outline',
  size = 'default',
  className 
}: GoHomeButtonProps) {
  const handleGoHome = onGoHome || (() => window.location.href = '/')

  return (
    <Button
      onClick={handleGoHome}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <Home className="h-4 w-4 mr-2" />
      Go Home
    </Button>
  )
}

interface ClearCacheButtonProps {
  onClearCache?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function ClearCacheButton({ 
  onClearCache, 
  variant = 'ghost',
  size = 'default',
  className 
}: ClearCacheButtonProps) {
  const handleClearCache = onClearCache || (() => {
    // Clear localStorage
    localStorage.clear()
    // Clear sessionStorage
    sessionStorage.clear()
    // Reload page
    window.location.reload()
  })

  return (
    <Button
      onClick={handleClearCache}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Clear Cache
    </Button>
  )
}

interface LogoutButtonProps {
  onLogout?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function LogoutButton({ 
  onLogout, 
  variant = 'ghost',
  size = 'default',
  className 
}: LogoutButtonProps) {
  const handleLogout = onLogout || (() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/auth'
  })

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}

// Recovery actions component
interface RecoveryActionsProps {
  actions: RecoveryAction[]
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export function RecoveryActions({ 
  actions, 
  layout = 'horizontal',
  className 
}: RecoveryActionsProps) {
  const getActionIcon = (type: RecoveryActionType) => {
    switch (type) {
      case RecoveryActionType.RETRY:
        return RefreshCw
      case RecoveryActionType.REFRESH:
        return RotateCcw
      case RecoveryActionType.CONTACT_SUPPORT:
        return MessageCircle
      case RecoveryActionType.REPORT_ISSUE:
        return Bug
      case RecoveryActionType.GO_BACK:
        return ArrowLeft
      case RecoveryActionType.CLEAR_CACHE:
        return Trash2
      case RecoveryActionType.LOGOUT:
        return LogOut
      case RecoveryActionType.RELOAD_PAGE:
        return RotateCcw
      default:
        return RefreshCw
    }
  }

  const getActionVariant = (action: RecoveryAction) => {
    if (action.primary) return 'default'
    if (action.destructive) return 'destructive'
    return 'outline'
  }

  if (actions.length === 0) return null

  return (
    <div className={cn(
      "flex gap-2",
      layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      className
    )}>
      {actions.map((action, index) => {
        const Icon = getActionIcon(action.type)
        const variant = getActionVariant(action)

        return (
          <Button
            key={index}
            onClick={action.action}
            variant={variant}
            size="sm"
            className="relative"
            title={action.description}
          >
            <Icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}

// Error recovery card component
interface ErrorRecoveryCardProps {
  title: string
  description: string
  actions: RecoveryAction[]
  className?: string
}

export function ErrorRecoveryCard({ 
  title, 
  description, 
  actions, 
  className 
}: ErrorRecoveryCardProps) {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <RecoveryActions 
          actions={actions} 
          layout="vertical"
        />
      </CardContent>
    </Card>
  )
}
