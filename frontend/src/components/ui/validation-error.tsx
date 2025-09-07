/**
 * Validation Error Component
 * Specialized component for displaying form validation errors
 */

import React from 'react'
import { ProcessedError, ValidationError as ValidationErrorType } from '@/types/errors'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ValidationErrorProps {
  error: ProcessedError | ValidationErrorType
  field?: string
  variant?: 'inline' | 'card' | 'tooltip'
  showIcon?: boolean
  showFieldName?: boolean
  className?: string
}

export function ValidationError({ 
  error, 
  field,
  variant = 'inline',
  showIcon = true,
  showFieldName = true,
  className 
}: ValidationErrorProps) {
  // Handle both ProcessedError and ValidationErrorType
  const message = 'message' in error ? error.message : (error as ProcessedError).userMessage
  const fieldName = field || ('field' in error ? error.field : undefined)
  
  const Icon = showIcon ? AlertCircle : null

  if (variant === 'tooltip') {
    return (
      <div className={cn("group relative", className)}>
        <div className="absolute -top-2 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {message}
          </div>
        </div>
        {Icon && <Icon className="h-4 w-4 text-destructive" />}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn("bg-destructive-muted border border-destructive/20 rounded-lg p-3", className)}>
        <div className="flex items-start space-x-2">
          {Icon && <Icon className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
          <div className="flex-1">
            {showFieldName && fieldName && (
              <p className="text-sm font-medium text-destructive mb-1">
                {fieldName}
              </p>
            )}
            <p className="text-sm text-destructive">
              {message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Icon && <Icon className="h-3 w-3 text-destructive flex-shrink-0" />}
      <p className="text-sm text-destructive">
        {showFieldName && fieldName && (
          <span className="font-medium">{fieldName}: </span>
        )}
        {message}
      </p>
    </div>
  )
}

// Field-level validation error component
interface FieldValidationErrorProps {
  error?: string
  touched?: boolean
  showIcon?: boolean
  className?: string
}

export function FieldValidationError({ 
  error, 
  touched = true,
  showIcon = true,
  className 
}: FieldValidationErrorProps) {
  if (!error || !touched) return null

  return (
    <div className={cn("mt-1", className)}>
      <ValidationError 
        error={{ message: error, field: '' }} 
        variant="inline"
        showIcon={showIcon}
        showFieldName={false}
      />
    </div>
  )
}

// Form-level validation summary component
interface ValidationSummaryProps {
  errors: (ProcessedError | ValidationErrorType)[]
  title?: string
  className?: string
}

export function ValidationSummary({ 
  errors, 
  title = "Please fix the following errors:",
  className 
}: ValidationSummaryProps) {
  if (errors.length === 0) return null

  return (
    <div className={cn("bg-destructive-muted border border-destructive/20 rounded-lg p-4", className)}>
      <div className="flex items-start space-x-2 mb-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <h3 className="text-sm font-medium text-destructive">
          {title}
        </h3>
      </div>
      
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
            <ValidationError 
              error={error} 
              variant="inline"
              showIcon={false}
              showFieldName={true}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Validation success component
interface ValidationSuccessProps {
  message: string
  field?: string
  showIcon?: boolean
  className?: string
}

export function ValidationSuccess({ 
  message, 
  field,
  showIcon = true,
  className 
}: ValidationSuccessProps) {
  const Icon = showIcon ? CheckCircle : null

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Icon && <Icon className="h-3 w-3 text-success flex-shrink-0" />}
      <p className="text-sm text-success">
        {field && <span className="font-medium">{field}: </span>}
        {message}
      </p>
    </div>
  )
}

// Validation info component
interface ValidationInfoProps {
  message: string
  field?: string
  showIcon?: boolean
  className?: string
}

export function ValidationInfo({ 
  message, 
  field,
  showIcon = true,
  className 
}: ValidationInfoProps) {
  const Icon = showIcon ? Info : null

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Icon && <Icon className="h-3 w-3 text-info flex-shrink-0" />}
      <p className="text-sm text-info">
        {field && <span className="font-medium">{field}: </span>}
        {message}
      </p>
    </div>
  )
}
