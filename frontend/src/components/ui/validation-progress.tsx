/**
 * Validation Progress and Success State Components
 * Provides visual feedback for form validation progress and success states
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, Clock, Loader2, Check, X } from 'lucide-react'
import { Progress } from './progress'

interface ValidationProgressProps {
  progress: number // 0-100
  isValidating?: boolean
  totalFields?: number
  validFields?: number
  className?: string
}

export function ValidationProgress({ 
  progress, 
  isValidating = false,
  totalFields,
  validFields,
  className 
}: ValidationProgressProps) {
  const getProgressColor = () => {
    if (progress === 100) return 'bg-success'
    if (progress >= 75) return 'bg-info'
    if (progress >= 50) return 'bg-warning'
    return 'bg-destructive'
  }

  const getProgressIcon = () => {
    if (isValidating) return Loader2
    if (progress === 100) return CheckCircle
    if (progress >= 75) return CheckCircle
    if (progress >= 50) return AlertCircle
    return AlertCircle
  }

  const Icon = getProgressIcon()

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={cn(
            "h-4 w-4",
            isValidating ? "animate-spin text-info" : 
            progress === 100 ? "text-success" :
            progress >= 75 ? "text-info" :
            progress >= 50 ? "text-warning" : "text-destructive"
          )} />
          <span className="text-sm font-medium text-foreground">
            Validation Progress
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {progress}%
        </span>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
      />
      
      {totalFields && validFields !== undefined && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{validFields} of {totalFields} fields valid</span>
          <span>{totalFields - validFields} errors remaining</span>
        </div>
      )}
    </div>
  )
}

interface ValidationSuccessProps {
  message?: string
  showIcon?: boolean
  className?: string
}

export function ValidationSuccess({ 
  message = "All fields are valid!",
  showIcon = true,
  className 
}: ValidationSuccessProps) {
  return (
    <div className={cn("flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg", className)}>
      {showIcon && <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />}
      <p className="text-sm text-success font-medium">
        {message}
      </p>
    </div>
  )
}

interface FieldValidationStatusProps {
  isValid: boolean
  isTouched: boolean
  isValidating?: boolean
  error?: string
  successMessage?: string
  className?: string
}

export function FieldValidationStatus({ 
  isValid, 
  isTouched, 
  isValidating = false,
  error,
  successMessage,
  className 
}: FieldValidationStatusProps) {
  if (!isTouched && !isValidating) return null

  if (isValidating) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-info" />
        <span className="text-xs text-info">Validating...</span>
      </div>
    )
  }

  if (isValid && isTouched) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <Check className="h-3 w-3 text-success" />
        <span className="text-xs text-success">
          {successMessage || "Valid"}
        </span>
      </div>
    )
  }

  if (error && isTouched) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <X className="h-3 w-3 text-destructive" />
        <span className="text-xs text-destructive">{error}</span>
      </div>
    )
  }

  return null
}

interface ValidationSummaryProps {
  totalFields: number
  validFields: number
  invalidFields: number
  untouchedFields: number
  className?: string
}

export function ValidationSummary({ 
  totalFields, 
  validFields, 
  invalidFields, 
  untouchedFields,
  className 
}: ValidationSummaryProps) {
  const completionPercentage = Math.round((validFields / totalFields) * 100)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Form Status</h4>
        <span className="text-sm text-muted-foreground">
          {completionPercentage}% Complete
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-success">{validFields} Valid</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <X className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{invalidFields} Invalid</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{untouchedFields} Untouched</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-info" />
          <span className="text-info">{totalFields} Total</span>
        </div>
      </div>
      
      <Progress 
        value={completionPercentage} 
        className="h-2"
      />
    </div>
  )
}

interface AutoSaveIndicatorProps {
  isAutoSaving: boolean
  lastSaved?: Date
  hasUnsavedChanges: boolean
  className?: string
}

export function AutoSaveIndicator({ 
  isAutoSaving, 
  lastSaved, 
  hasUnsavedChanges,
  className 
}: AutoSaveIndicatorProps) {
  const getStatusMessage = () => {
    if (isAutoSaving) return "Saving..."
    if (hasUnsavedChanges) return "Unsaved changes"
    if (lastSaved) return `Saved ${lastSaved.toLocaleTimeString()}`
    return "All changes saved"
  }

  const getStatusColor = () => {
    if (isAutoSaving) return "text-info"
    if (hasUnsavedChanges) return "text-warning"
    return "text-success"
  }

  const getStatusIcon = () => {
    if (isAutoSaving) return Loader2
    if (hasUnsavedChanges) return AlertCircle
    return CheckCircle
  }

  const Icon = getStatusIcon()

  return (
    <div className={cn("flex items-center space-x-2 text-xs", className)}>
      <Icon className={cn(
        "h-3 w-3",
        getStatusColor(),
        isAutoSaving && "animate-spin"
      )} />
      <span className={getStatusColor()}>
        {getStatusMessage()}
      </span>
    </div>
  )
}

interface FormRecoveryPromptProps {
  hasRecoveryData: boolean
  onRestore: () => void
  onDiscard: () => void
  className?: string
}

export function FormRecoveryPrompt({ 
  hasRecoveryData, 
  onRestore, 
  onDiscard,
  className 
}: FormRecoveryPromptProps) {
  if (!hasRecoveryData) return null

  return (
    <div className={cn("p-4 bg-warning/10 border border-warning/20 rounded-lg", className)}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">
            Unsaved Changes Detected
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            We found unsaved changes from a previous session. Would you like to restore them?
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onRestore}
              className="px-3 py-1 bg-warning text-warning-foreground rounded text-sm font-medium hover:bg-warning/90"
            >
              Restore Changes
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm font-medium hover:bg-muted/80"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
