import { cn } from "@/lib/utils"
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react"

interface TrustScoreProps {
  score: number // 0-100
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function TrustScore({
  score,
  size = "md",
  showLabel = true,
  className,
}: TrustScoreProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 80)
      return {
        color: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success/20",
        icon: ShieldCheck,
        label: "High Trust",
      }
    if (score >= 60)
      return {
        color: "text-info",
        bgColor: "bg-info/10",
        borderColor: "border-info/20",
        icon: Shield,
        label: "Medium Trust",
      }
    if (score >= 40)
      return {
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/20",
        icon: ShieldAlert,
        label: "Low Trust",
      }
    return {
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
      icon: ShieldX,
      label: "Very Low Trust",
    }
  }

  const config = getScoreConfig(score)
  const Icon = config.icon

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border",
          config.bgColor,
          config.borderColor,
          sizeClasses[size]
        )}
      >
        <Icon className={cn(config.color, iconSizes[size])} />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn("font-medium", config.color)}>
            {score}%
          </span>
          <span className="text-xs text-muted-foreground">
            {config.label}
          </span>
        </div>
      )}
    </div>
  )
}
