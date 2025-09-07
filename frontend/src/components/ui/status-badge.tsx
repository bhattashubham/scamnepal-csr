import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Info,
  Shield,
  AlertCircle,
} from "lucide-react"

interface StatusBadgeProps {
  status:
    | "verified"
    | "pending"
    | "rejected"
    | "investigating"
    | "resolved"
    | "high-risk"
    | "info"
  className?: string
}

const statusConfig = {
  verified: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Verified",
    description: "Report has been verified as legitimate",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pending Review",
    description: "Report is awaiting moderation",
  },
  rejected: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
    description: "Report has been rejected",
  },
  investigating: {
    variant: "info" as const,
    icon: Info,
    label: "Under Investigation",
    description: "Report is being investigated",
  },
  resolved: {
    variant: "success" as const,
    icon: Shield,
    label: "Resolved",
    description: "Issue has been resolved",
  },
  "high-risk": {
    variant: "destructive" as const,
    icon: AlertTriangle,
    label: "High Risk",
    description: "High risk scam - urgent attention needed",
  },
  info: {
    variant: "info" as const,
    icon: AlertCircle,
    label: "Information",
    description: "General information",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1 font-medium", className)}
      title={config.description}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
