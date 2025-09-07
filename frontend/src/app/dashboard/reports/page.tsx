'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useReports, useUpdateReportStatus, useDeleteReport } from '@/hooks/useReports'
import { formatCurrency, formatRelativeTime, formatRiskScore } from '@/lib/utils'
import { Report } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl } from '@/lib/config'
import { getStatusColors, getRiskScoreColors } from '@/lib/theme-utils'

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Report['status']>('all')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Get auth state for debugging
  const { user, token, isAuthenticated } = useAuthStore()

  // API hooks
  const { data: reportsData, isLoading, error } = useReports(
    {
      ...(statusFilter !== 'all' && { statuses: [statusFilter] }),
    },
    page,
    20
  )

  const updateStatusMutation = useUpdateReportStatus()
  const deleteReportMutation = useDeleteReport()

  const reports = reportsData?.data?.data || []
  const totalReports = reportsData?.data?.total || 0

  // Debug function to test API directly
  const testAPI = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/reports/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      console.log('Direct API test:', data)
      alert(`API Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('API test error:', error)
      alert(`API Error: ${error}`)
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    const colors = getStatusColors(status)
    switch (status) {
      case 'verified':
        return <CheckCircle className={`h-4 w-4 ${colors.icon}`} />
      case 'pending':
        return <Clock className={`h-4 w-4 ${colors.icon}`} />
      case 'under_review':
        return <AlertTriangle className={`h-4 w-4 ${colors.icon}`} />
      case 'rejected':
        return <XCircle className={`h-4 w-4 ${colors.icon}`} />
      default:
        return <Clock className={`h-4 w-4 ${colors.icon}`} />
    }
  }

  const getStatusColor = (status: Report['status']) => {
    const colors = getStatusColors(status)
    return `${colors.text} ${colors.bg} border-border`
  }

  const handleStatusUpdate = async (reportId: string, newStatus: Report['status']) => {
    try {
      await updateStatusMutation.mutateAsync({ 
        id: reportId, 
        status: newStatus,
        notes: `Status updated to ${newStatus} by ${user?.name || user?.email || 'Unknown User'}` 
      })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReportMutation.mutateAsync(reportId)
      } catch (error) {
        console.error('Failed to delete report:', error)
      }
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.identifierValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.narrative.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load reports</h3>
          <p className="text-gray-600">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Debug Section */}
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Auth Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            </div>
            <div>
              <strong>User:</strong> {user ? `${user.email} (${user.role})` : 'None'}
            </div>
            <div>
              <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
            </div>
            <div>
              <strong>Reports Data:</strong> {reportsData ? '✅ Loaded' : '❌ Not Loaded'}
            </div>
            <div>
              <strong>Reports Count:</strong> {reports.length}
            </div>
            <div>
              <strong>Total Reports:</strong> {totalReports}
            </div>
            <div>
              <strong>Loading:</strong> {isLoading ? '⏳ Loading' : '✅ Complete'}
            </div>
            <div>
              <strong>Error:</strong> {error ? '❌ ' + error : '✅ None'}
            </div>
            <div>
              <Button onClick={testAPI} size="sm" variant="outline">
                Test API Directly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">
              Manage and review scam reports from the community
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Link href="/dashboard/reports/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'verified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports by identifier, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            {filteredReports.length} of {totalReports} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Lost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => {
                    const riskInfo = formatRiskScore(report.riskScore)
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.category}
                            </div>
                            <div className="text-sm text-gray-600">
                              {report.identifierType}: {report.identifierValue}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskInfo.bgColor} ${riskInfo.color}`}>
                            {report.riskScore} - {riskInfo.label}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(report.amountLost, report.currency)}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatRelativeTime(report.createdAt)}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/reports/${report.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            
                            <div className="relative">
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              {/* Dropdown menu would go here */}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalReports > 20 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalReports)} of {totalReports} results
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= totalReports}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
