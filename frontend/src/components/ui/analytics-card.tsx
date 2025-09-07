import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
    period: string
  }
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  variant?: "default" | "success" | "warning" | "destructive" | "info"
}

export function AnalyticsCard({
  title,
  value,
  change,
  icon: Icon,
  className,
  variant = "default",
}: AnalyticsCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
    destructive: "border-destructive/20 bg-destructive/5",
    info: "border-info/20 bg-info/5",
  }

  const getTrendIcon = () => {
    if (!change) return null
    switch (change.type) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-success" />
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      case "neutral":
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    if (!change) return ""
    switch (change.type) {
      case "increase":
        return "text-success"
      case "decrease":
        return "text-destructive"
      case "neutral":
        return "text-muted-foreground"
    }
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 text-xs">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
            <span className="text-muted-foreground">
              from {change.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
