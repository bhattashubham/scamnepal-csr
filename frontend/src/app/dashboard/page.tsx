'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Users, 
  FileText,
  Search,
  BarChart3,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useReports, useReportStats } from '@/hooks/useReports'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { ReportStats } from '@/types'
import { getStatusColors, getRiskScoreColors } from '@/lib/theme-utils'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  // Fetch real data from API
  const { data: reportsData, isLoading: reportsLoading } = useReports(undefined, 1, 5)
  const { data: statsData, isLoading: statsLoading } = useReportStats(timeframe)

  const recentReports = reportsData?.data?.data || []
  const stats = (statsData?.data || {
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalAmountLost: 0,
    averageAmount: 0,
    recentActivity: [] as Array<{
      id: string
      type: string
      title: string
      description: string
      timestamp: string
      status: string
    }>,
    categoryBreakdown: {} as Record<string, number>
  }) as ReportStats

  // Ensure numeric values are valid
  const safeStats = {
    ...stats,
    totalReports: Number(stats.totalReports) || 0,
    pendingReports: Number(stats.pendingReports) || 0,
    approvedReports: Number(stats.approvedReports) || 0,
    rejectedReports: Number(stats.rejectedReports) || 0,
    totalAmountLost: Number(stats.totalAmountLost) || 0,
    averageAmount: Number(stats.averageAmount) || 0,
    totalUsers: Number(stats.totalUsers) || 0
  }

  const getStatusColor = (status: string) => {
    const colors = getStatusColors(status)
    return `${colors.text} ${colors.bg} border-border`
  }

  const getRiskScoreColor = (score: number) => {
    return getRiskScoreColors(score)
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'investment':
        return <TrendingUp className="h-4 w-4" />
      case 'phishing':
        return <AlertTriangle className="h-4 w-4" />
      case 'romance':
        return <Users className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleReportClick = (reportId: string) => {
    router.push(`/dashboard/reports/${reportId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in the Community Scam Registry
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-input p-1 bg-muted/50">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeframe === period
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            
            <Button
              onClick={() => window.location.href = '/dashboard/reports/new'}
            >
              <FileText className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : safeStats.totalReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              {safeStats.totalReports > 0 ? 
                `${safeStats.totalReports} total reports` :
                'No reports yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Scams</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : safeStats.approvedReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {safeStats.totalReports > 0 ? 
                `${Math.round((safeStats.approvedReports / safeStats.totalReports) * 100)}% verification rate` :
                'No reports yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loss Prevented</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatCurrency(safeStats.totalAmountLost, 'INR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated potential losses prevented
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : safeStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users on platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Reports</CardTitle>
                <Link href="/dashboard/reports">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Latest scam reports submitted to the registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentReports.length > 0 ? (
                <div className="space-y-4">
                  {recentReports.map((report: any) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleReportClick(report.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-muted">
                          {getCategoryIcon(report.category)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {`${report.category} Report #${report.id.slice(0, 8)}...`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {report.category} • {formatRelativeTime(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to submit a scam report
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Trending Scams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Trending Scams
              </CardTitle>
              <CardDescription>
                Most reported scam types this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(stats.categoryBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count as number} reports
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No category data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/reports/new" className="w-full">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit New Report
                </Button>
              </Link>
              
              <Link href="/dashboard/search" className="w-full">
                <Button className="w-full justify-start" variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search Registry
                </Button>
              </Link>
              
              {(user?.role === 'moderator' || user?.role === 'admin') && (
                <Link href="/dashboard/moderation" className="w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Review Queue
                  </Button>
                </Link>
              )}
              
              <Link href="/dashboard/analytics" className="w-full">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm font-medium text-foreground">
                  {statsLoading ? '...' : '< 100ms'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
