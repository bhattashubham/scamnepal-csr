import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid Date'
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch (error) {
    console.error('Error formatting date:', date, error)
    return 'Invalid Date'
  }
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const now = new Date()
    const target = new Date(date)
    
    if (isNaN(target.getTime())) return 'Invalid Date'
    
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return formatDate(target)
  } catch (error) {
    console.error('Error formatting relative time:', date, error)
    return 'Invalid Date'
  }
}

export function formatRiskScore(score: number): {
  label: string
  color: string
  bgColor: string
} {
  if (score >= 80) return { 
    label: 'Critical', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200' 
  }
  if (score >= 60) return { 
    label: 'High', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200' 
  }
  if (score >= 40) return { 
    label: 'Medium', 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50 border-yellow-200' 
  }
  if (score >= 20) return { 
    label: 'Low', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200' 
  }
  return { 
    label: 'Minimal', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200' 
  }
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
