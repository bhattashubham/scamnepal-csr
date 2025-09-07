/**
 * File Upload Error Component
 * Specialized component for displaying file upload errors
 */

import React from 'react'
import { ProcessedError, FileUploadError as FileUploadErrorType } from '@/types/errors'
import { cn } from '@/lib/utils'
import { Upload, FileX, AlertTriangle, HardDrive, Wifi, Clock } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { createSupportMailto } from '@/lib/config'

interface FileUploadErrorProps {
  error: ProcessedError | FileUploadErrorType
  variant?: 'inline' | 'card' | 'toast'
  showRetryButton?: boolean
  onRetry?: () => void
  onRemoveFile?: () => void
  className?: string
}

export function FileUploadError({ 
  error, 
  variant = 'card',
  showRetryButton = true,
  onRetry,
  onRemoveFile,
  className 
}: FileUploadErrorProps) {
  // Handle both ProcessedError and FileUploadErrorType
  const message = 'message' in error ? error.message : (error as unknown as ProcessedError).userMessage
  const reason = 'reason' in error ? error.reason : undefined
  const fileName = 'fileName' in error ? error.fileName : undefined
  const fileSize = 'fileSize' in error ? error.fileSize : undefined
  const fileType = 'fileType' in error ? error.fileType : undefined
  const maxSize = 'maxSize' in error ? error.maxSize : undefined
  const allowedTypes = 'allowedTypes' in error ? error.allowedTypes : undefined

  const getUploadIcon = () => {
    switch (reason) {
      case 'size_exceeded':
        return HardDrive
      case 'invalid_type':
        return FileX
      case 'upload_timeout':
        return Clock
      case 'storage_quota':
        return HardDrive
      case 'virus_detected':
        return AlertTriangle
      case 'network_error':
        return Wifi
      default:
        return Upload
    }
  }

  const getUploadMessage = () => {
    switch (reason) {
      case 'size_exceeded':
        return `File is too large. Maximum size allowed is ${maxSize ? `${(maxSize / 1024 / 1024).toFixed(1)}MB` : 'unknown'}.`
      case 'invalid_type':
        return `File type not supported. Allowed types: ${allowedTypes ? allowedTypes.join(', ') : 'unknown'}.`
      case 'upload_timeout':
        return 'Upload timed out. Please check your connection and try again.'
      case 'storage_quota':
        return 'Storage quota exceeded. Please contact support or try a smaller file.'
      case 'virus_detected':
        return 'File was rejected due to security concerns. Please try a different file.'
      case 'network_error':
        return 'Network error during upload. Please check your connection and try again.'
      default:
        return message
    }
  }

  const getRecoveryActions = () => {
    const actions = []

    switch (reason) {
      case 'size_exceeded':
        actions.push({
          label: 'Choose Smaller File',
          action: onRetry || (() => {}),
          primary: true
        })
        if (onRemoveFile) {
          actions.push({
            label: 'Remove File',
            action: onRemoveFile
          })
        }
        break
      case 'invalid_type':
        actions.push({
          label: 'Choose Different File',
          action: onRetry || (() => {}),
          primary: true
        })
        if (onRemoveFile) {
          actions.push({
            label: 'Remove File',
            action: onRemoveFile
          })
        }
        break
      case 'upload_timeout':
      case 'network_error':
        actions.push({
          label: 'Retry Upload',
          action: onRetry || (() => {}),
          primary: true
        })
        if (onRemoveFile) {
          actions.push({
            label: 'Remove File',
            action: onRemoveFile
          })
        }
        break
      case 'storage_quota':
        actions.push({
          label: 'Contact Support',
          action: () => window.open(createSupportMailto('Storage Quota Exceeded', 'I need help with storage quota limits.'))
        })
        break
      case 'virus_detected':
        actions.push({
          label: 'Choose Different File',
          action: onRetry || (() => {}),
          primary: true
        })
        if (onRemoveFile) {
          actions.push({
            label: 'Remove File',
            action: onRemoveFile
          })
        }
        break
      default:
        if (showRetryButton && onRetry) {
          actions.push({
            label: 'Retry Upload',
            action: onRetry,
            primary: true
          })
        }
        if (onRemoveFile) {
          actions.push({
            label: 'Remove File',
            action: onRemoveFile
          })
        }
    }

    return actions
  }

  const Icon = getUploadIcon()
  const actions = getRecoveryActions()

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive">
          {getUploadMessage()}
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

  if (variant === 'toast') {
    return (
      <div className={cn("flex items-center space-x-2 p-3 bg-destructive-muted border border-destructive/20 rounded-lg", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive flex-1">
          {getUploadMessage()}
        </p>
        {actions.length > 0 && (
          <Button
            onClick={actions[0].action}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
          >
            {actions[0].label}
          </Button>
        )}
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
            Upload Error
          </CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          {getUploadMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Details */}
        {(fileName || fileSize || fileType) && (
          <div className="bg-background/50 rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-2">File Details</h4>
            <div className="space-y-2 text-sm">
              {fileName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Name:</span>
                  <span className="text-foreground font-mono">{fileName}</span>
                </div>
              )}
              {fileSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className="text-foreground">
                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              {fileType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Type:</span>
                  <span className="text-foreground">{fileType}</span>
                </div>
              )}
              {maxSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Size:</span>
                  <span className="text-foreground">
                    {(maxSize / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Details */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Type:</span>
              <span className="text-foreground capitalize">
                {reason?.replace('_', ' ') || 'Upload Error'}
              </span>
            </div>
            {allowedTypes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allowed Types:</span>
                <span className="text-foreground text-xs">
                  {allowedTypes.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Actions */}
        {actions.length > 0 && (
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
        )}

        {/* Upload Tips */}
        <div className="bg-background/30 rounded-lg p-3">
          <h4 className="font-medium text-foreground mb-2 text-sm">Upload Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure your file is under the size limit</li>
            <li>• Check that the file format is supported</li>
            <li>• Make sure you have a stable internet connection</li>
            <li>• Try compressing large files before uploading</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// File upload progress component
interface FileUploadProgressProps {
  fileName: string
  progress: number
  onCancel?: () => void
  className?: string
}

export function FileUploadProgress({ 
  fileName, 
  progress, 
  onCancel,
  className 
}: FileUploadProgressProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground truncate">
          {fileName}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      
      {onCancel && (
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="w-full"
        >
          Cancel Upload
        </Button>
      )}
    </div>
  )
}

// File upload success component
interface FileUploadSuccessProps {
  fileName: string
  fileSize: number
  onRemove?: () => void
  className?: string
}

export function FileUploadSuccess({ 
  fileName, 
  fileSize, 
  onRemove,
  className 
}: FileUploadSuccessProps) {
  return (
    <div className={cn("flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg", className)}>
      <div className="flex items-center space-x-2">
        <Upload className="h-4 w-4 text-success" />
        <div>
          <p className="text-sm font-medium text-success">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {(fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
      
      {onRemove && (
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          Remove
        </Button>
      )}
    </div>
  )
}
