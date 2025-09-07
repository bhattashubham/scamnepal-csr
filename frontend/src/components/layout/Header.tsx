"use client"

import { useState } from "react"
import { Bell, Search, Plus, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/config"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className={cn("bg-card border-b h-16", className)}>
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Search Bar */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm"
                  placeholder="Search entities, reports..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Action - Create Report */}
            <Button
              size="sm"
              className="hidden sm:flex"
              onClick={() => (window.location.href = "/dashboard/reports/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Report
            </Button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-popover rounded-md shadow-lg py-1 z-50 border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="text-sm font-medium text-popover-foreground">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-accent">
                      <p className="text-sm text-popover-foreground">
                        New report requires review
                      </p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-accent">
                      <p className="text-sm text-popover-foreground">
                        High-risk entity identified
                      </p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-accent">
                      <p className="text-sm text-popover-foreground">
                        System maintenance scheduled
                      </p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border">
                    <button className="text-sm text-primary hover:text-primary-hover">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring p-1"
              >
                {user?.profileImage ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt={user.email}
                    className="h-8 w-8 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <span className="hidden lg:block text-foreground font-medium">
                  {user?.email}
                </span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg py-1 z-50 border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-popover-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </button>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>

                  <div className="border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
}