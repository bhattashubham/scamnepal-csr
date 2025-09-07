/**
 * Loading and Error State Components
 * Components for displaying loading, error, and empty states
 */

import React from 'react'
import { ProcessedError } from '@/types/errors'
import { cn } from '@/lib/utils'
import { Loader2, AlertTriangle, FileX, Search, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  error: ProcessedError
  title?: string
  showRetryButton?: boolean
  onRetry?: () => void
  className?: string
}

export function ErrorState({ 
  error, 
  title = "Something went wrong",
  showRetryButton = true,
  onRetry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="p-3 bg-destructive/10 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.userMessage}
      </p>
      
      {showRetryButton && onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
      
      <div className="mt-4 text-xs text-muted-foreground">
        Error ID: {error.id}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon,
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  const defaultIcon = <FileX className="h-12 w-12 text-muted-foreground" />
  
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="p-3 bg-muted/50 rounded-full mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  showAvatar?: boolean
}

export function SkeletonLoader({ 
  className, 
  lines = 3,
  showAvatar = false 
}: SkeletonLoaderProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        )}
        
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-muted rounded" />
            {index === lines - 1 && (
              <div className="h-4 bg-muted rounded w-3/4" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProgressIndicatorProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressIndicator({ 
  progress, 
  label,
  showPercentage = true,
  className 
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  showProgress?: boolean
  progress?: number
  className?: string
}

export function LoadingCard({ 
  title = "Loading...",
  description,
  showProgress = false,
  progress,
  className 
}: LoadingCardProps) {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {showProgress && progress !== undefined && (
              <ProgressIndicator 
                progress={progress} 
                className="mt-3"
                showPercentage={true}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface SearchEmptyStateProps {
  query?: string
  onClearSearch?: () => void
  className?: string
}

export function SearchEmptyState({ 
  query,
  onClearSearch,
  className 
}: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-muted-foreground" />}
      title="No results found"
      description={
        query 
          ? `No results found for "${query}". Try adjusting your search terms or filters.`
          : "No search results to display. Try entering a search term."
      }
      action={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch
      } : undefined}
      className={className}
    />
  )
}

interface DataLoadingStateProps {
  isLoading: boolean
  error?: ProcessedError
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRetry?: () => void
  onRefresh?: () => void
  children: React.ReactNode
  className?: string
}

export function DataLoadingState({ 
  isLoading,
  error,
  isEmpty = false,
  emptyTitle = "No data available",
  emptyDescription = "There's no data to display at the moment.",
  onRetry,
  onRefresh,
  children,
  className 
}: DataLoadingStateProps) {
  if (isLoading) {
    return <LoadingCard className={className} />
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        onRetry={onRetry}
        className={className}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={onRefresh ? {
          label: "Refresh",
          onClick: onRefresh
        } : undefined}
        className={className}
      />
    )
  }

  return <>{children}</>
}

interface InlineLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function InlineLoading({ 
  isLoading,
  children,
  fallback,
  className 
}: InlineLoadingProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        {fallback || <LoadingSpinner size="sm" text="Loading..." />}
      </div>
    )
  }

  return <>{children}</>
}
