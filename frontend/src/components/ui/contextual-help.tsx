/**
 * Contextual Help and User Guidance Components
 * Provides help tooltips, error explanations, and recovery suggestions
 */

import React, { useState, useRef, useEffect } from 'react'
import { ProcessedError, RecoveryAction } from '@/types/errors'
import { cn } from '@/lib/utils'
import { HelpCircle, Info, Lightbulb, ExternalLink, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

interface HelpTooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function HelpTooltip({ content, children, side = 'top', className }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center", className)}>
            {children}
            <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground cursor-help" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ErrorExplanationProps {
  error: ProcessedError
  showRecoveryActions?: boolean
  className?: string
}

export function ErrorExplanation({ error, showRecoveryActions = true, className }: ErrorExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getErrorExplanation = (error: ProcessedError): string => {
    switch (error.type) {
      case 'validation':
        return 'This error occurs when the information you entered doesn\'t meet the required format or criteria. Please check your input and make sure all required fields are filled correctly.'
      case 'network':
        return 'This error indicates a problem with your internet connection or the server. The request couldn\'t be completed due to network issues.'
      case 'authentication':
        return 'This error means your login session has expired or your credentials are invalid. You\'ll need to log in again to continue.'
      case 'authorization':
        return 'This error means you don\'t have permission to perform this action. Please contact your administrator if you believe this is an error.'
      case 'business_logic':
        return 'This error occurs when the action you\'re trying to perform conflicts with business rules or existing data.'
      case 'file_upload':
        return 'This error occurs when there\'s a problem uploading your file. The file might be too large, in an unsupported format, or there might be a network issue.'
      case 'system':
        return 'This is a system error that indicates a problem with our servers. Please try again later or contact support if the problem persists.'
      default:
        return 'This is an unexpected error. Please try again or contact support if the problem continues.'
    }
  }

  const getRecoverySuggestions = (error: ProcessedError): string[] => {
    switch (error.type) {
      case 'validation':
        return [
          'Check that all required fields are filled',
          'Verify the format of your input (email, phone number, etc.)',
          'Make sure passwords meet the requirements',
          'Check for any special characters that might not be allowed'
        ]
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again',
          'Check if other websites are working'
        ]
      case 'authentication':
        return [
          'Log in again with your credentials',
          'Check if your account is still active',
          'Try resetting your password if needed',
          'Contact support if you can\'t log in'
        ]
      case 'authorization':
        return [
          'Contact your administrator for access',
          'Check if you\'re using the correct account',
          'Verify your permissions with your team lead',
          'Try logging out and back in'
        ]
      case 'business_logic':
        return [
          'Review the information you entered',
          'Check if the data already exists',
          'Verify you\'re following the correct process',
          'Contact support for clarification'
        ]
      case 'file_upload':
        return [
          'Check the file size (must be under the limit)',
          'Verify the file format is supported',
          'Try compressing the file if it\'s too large',
          'Check your internet connection'
        ]
      case 'system':
        return [
          'Wait a few minutes and try again',
          'Refresh the page',
          'Clear your browser cache',
          'Contact support if the problem persists'
        ]
      default:
        return [
          'Try the action again',
          'Refresh the page',
          'Check your internet connection',
          'Contact support if the problem continues'
        ]
    }
  }

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-info" />
            <CardTitle className="text-lg">Error Explanation</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
            <ChevronRight className={cn("h-4 w-4 ml-1 transition-transform", isExpanded && "rotate-90")} />
          </Button>
        </div>
        <CardDescription>
          Understanding what went wrong and how to fix it
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">What happened?</h4>
          <p className="text-sm text-muted-foreground">
            {getErrorExplanation(error)}
          </p>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="bg-info/10 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-info" />
                How to fix it
              </h4>
              <ul className="space-y-2">
                {getRecoverySuggestions(error).map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="w-2 h-2 bg-info rounded-full mt-2 mr-3 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {showRecoveryActions && error.recoveryActions.length > 0 && (
              <div className="bg-success/10 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {error.recoveryActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RecoverySuggestionsProps {
  error: ProcessedError
  onActionClick?: (action: RecoveryAction) => void
  className?: string
}

export function RecoverySuggestions({ error, onActionClick, className }: RecoverySuggestionsProps) {
  const handleActionClick = (action: RecoveryAction) => {
    if (onActionClick) {
      onActionClick(action)
    } else {
      action.action()
    }
  }

  if (error.recoveryActions.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-medium text-foreground flex items-center">
        <Lightbulb className="h-4 w-4 mr-2 text-info" />
        Suggested Actions
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {error.recoveryActions.map((action, index) => (
          <Button
            key={index}
            onClick={() => handleActionClick(action)}
            variant={action.primary ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            disabled={action.disabled}
          >
            {action.label}
            {action.description && (
              <span className="text-xs text-muted-foreground ml-2">
                {action.description}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface ContextualHelpProps {
  title: string
  content: string
  type?: 'info' | 'warning' | 'success' | 'error'
  showIcon?: boolean
  className?: string
}

export function ContextualHelp({ title, content, type = 'info', showIcon = true, className }: ContextualHelpProps) {
  const getIcon = () => {
    if (!showIcon) return null
    
    switch (type) {
      case 'warning':
        return <HelpCircle className="h-4 w-4 text-warning" />
      case 'success':
        return <HelpCircle className="h-4 w-4 text-success" />
      case 'error':
        return <HelpCircle className="h-4 w-4 text-destructive" />
      default:
        return <Info className="h-4 w-4 text-info" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/20'
      case 'success':
        return 'bg-success/10 border-success/20'
      case 'error':
        return 'bg-destructive/10 border-destructive/20'
      default:
        return 'bg-info/10 border-info/20'
    }
  }

  return (
    <div className={cn("rounded-lg border p-3", getBackgroundColor(), className)}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-foreground text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{content}</p>
        </div>
      </div>
    </div>
  )
}

interface SupportContactProps {
  errorId?: string
  className?: string
}

export function SupportContact({ errorId, className }: SupportContactProps) {
  const handleContactSupport = () => {
    const subject = 'Support Request - Application Error'
    const body = [
      'I encountered an error while using the application.',
      '',
      'Error Details:',
      errorId ? `Error ID: ${errorId}` : '',
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      '',
      'Please provide any additional details or steps to reproduce the issue:',
      '',
      'Thank you for your assistance.'
    ].filter(Boolean).join('\n')

    const mailtoLink = `mailto:support@scamnepal.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-medium text-foreground">Need More Help?</h4>
      <div className="space-y-2">
        <Button
          onClick={handleContactSupport}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
        <Button
          onClick={() => window.open('/help', '_blank')}
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          View Help Center
        </Button>
      </div>
    </div>
  )
}

// Hook for contextual help
export function useContextualHelp() {
  const [helpVisible, setHelpVisible] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  const showHelp = () => setHelpVisible(true)
  const hideHelp = () => setHelpVisible(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        hideHelp()
      }
    }

    if (helpVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [helpVisible])

  return {
    helpVisible,
    showHelp,
    hideHelp,
    helpRef,
  }
}
