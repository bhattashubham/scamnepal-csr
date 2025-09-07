import { cn } from "@/lib/utils"
import { AlertTriangle, XCircle, AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message: string
  variant?: "default" | "inline" | "card"
  className?: string
  showIcon?: boolean
}

export function ErrorMessage({ 
  message, 
  variant = "default", 
  className,
  showIcon = true 
}: ErrorMessageProps) {
  const Icon = showIcon ? AlertTriangle : null

  if (variant === "inline") {
    return (
      <p className={cn("text-sm text-destructive mt-1", className)}>
        {message}
      </p>
    )
  }

  if (variant === "card") {
    return (
      <div className={cn("bg-destructive-muted border border-destructive/20 rounded-md p-3", className)}>
        <div className="flex items-center">
          {Icon && <Icon className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />}
          <p className="text-sm text-destructive">{message}</p>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("bg-destructive-muted border border-destructive/20 rounded-md p-3", className)}>
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />}
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </div>
  )
}
