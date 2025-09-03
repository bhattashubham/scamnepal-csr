'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and statistics'
  },
  {
    name: 'Search',
    href: '/dashboard/search',
    icon: Search,
    description: 'Search the registry'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Manage scam reports'
  },
  {
    name: 'Entities',
    href: '/dashboard/entities',
    icon: AlertTriangle,
    description: 'Flagged entities'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Data insights'
  },
]

const moderatorNavigation = [
  {
    name: 'Moderation',
    href: '/dashboard/moderation',
    icon: Shield,
    description: 'Review queue'
  },
]

const adminNavigation = [
  {
    name: 'User Management',
    href: '/dashboard/admin/users',
    icon: Users,
    description: 'Manage users and roles'
  },
]

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account settings'
  },
  {
    name: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle,
    description: 'Support center'
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuthStore()

  const isModerator = user?.role === 'moderator' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">CSR</h1>
              <p className="text-xs text-gray-500">v1.0.0</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                title={collapsed ? item.description : undefined}
              >
                <item.icon
                  className={cn(
                    'flex-shrink-0 h-5 w-5',
                    collapsed ? 'mx-auto' : 'mr-3',
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Moderator Section */}
        {isModerator && (
          <>
            <div className="border-t border-gray-200 pt-4 mt-4">
              {!collapsed && (
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Moderation
                </h3>
              )}
              <div className="space-y-1">
                {moderatorNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      title={collapsed ? item.description : undefined}
                    >
                      <item.icon
                        className={cn(
                          'flex-shrink-0 h-5 w-5',
                          collapsed ? 'mx-auto' : 'mr-3',
                          isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
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
            <div className="border-t border-gray-200 pt-4 mt-4">
              {!collapsed && (
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Administration
                </h3>
              )}
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      title={collapsed ? item.description : undefined}
                    >
                      <item.icon
                        className={cn(
                          'flex-shrink-0 h-5 w-5',
                          collapsed ? 'mx-auto' : 'mr-3',
                          isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-100 text-indigo-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.description : undefined}
            >
              <item.icon
                className={cn(
                  'flex-shrink-0 h-5 w-5',
                  collapsed ? 'mx-auto' : 'mr-3',
                  isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
