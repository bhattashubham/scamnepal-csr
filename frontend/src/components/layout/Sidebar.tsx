"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  FileText,
  Shield,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and statistics",
  },
  {
    name: "Search",
    href: "/dashboard/search",
    icon: Search,
    description: "Search the registry",
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    description: "Manage scam reports",
  },
  {
    name: "Entities",
    href: "/dashboard/entities",
    icon: AlertTriangle,
    description: "Flagged entities",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Data insights",
  },
]

const moderatorNavigation = [
  {
    name: "Moderation",
    href: "/dashboard/moderation",
    icon: Shield,
    description: "Review queue",
  },
]

const adminNavigation = [
  {
    name: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    description: "Manage users and roles",
  },
]

const bottomNavigation = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Account settings",
  },
  {
    name: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    description: "Support center",
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuthStore()

  const isModerator = user?.role === "moderator" || user?.role === "admin"
  const isAdmin = user?.role === "admin"

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-gradient">ScamNepal</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Moderator Section */}
        {isModerator && (
          <>
            <div className="border-t pt-4 mt-4">
              {!collapsed && (
                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Moderation
                </h3>
              )}
              <div className="space-y-1">
                {moderatorNavigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          collapsed && "justify-center px-0"
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="border-t pt-4 mt-4">
              {!collapsed && (
                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Administration
                </h3>
              )}
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          collapsed && "justify-center px-0"
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-2 py-4 border-t space-y-2">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Button>
            </Link>
          )
        })}
        <div
          className={cn(
            "flex justify-center pt-2",
            !collapsed && "justify-start"
          )}
        >
          <ThemeToggle />
        </div>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}