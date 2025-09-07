'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus,
  Shield,
  TrendingUp,
  Users,
  FileText,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEntities, useEntityStats } from '@/hooks/useEntities'
import { formatRiskScore, formatCurrency } from '@/lib/utils'
import { Entity } from '@/types'
import { getStatusColors } from '@/lib/theme-utils'
import Link from 'next/link'

export default function EntitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Entity['status']>('all')
  const [page, setPage] = useState(1)

  // API hooks
  const { data: entitiesData, isLoading, error } = useEntities(
    {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchQuery && { search: searchQuery }),
    },
    page,
    20
  )

  const { data: statsData } = useEntityStats()

  const entities = entitiesData?.data?.data || []
  const totalEntities = entitiesData?.data?.total || 0
  const stats = statsData?.data

  const getStatusIcon = (status: Entity['status']) => {
    const colors = getStatusColors(status)
    switch (status) {
      case 'confirmed':
        return <AlertTriangle className={`h-4 w-4 ${colors.icon}`} />
      case 'alleged':
        return <Shield className={`h-4 w-4 ${colors.icon}`} />
      case 'disputed':
        return <TrendingUp className={`h-4 w-4 ${colors.icon}`} />
      case 'cleared':
        return <Shield className={`h-4 w-4 ${colors.icon}`} />
      default:
        return <Shield className={`h-4 w-4 ${colors.icon}`} />
    }
  }

  const getStatusColor = (status: Entity['status']) => {
    const colors = getStatusColors(status)
    return `${colors.text} ${colors.bg} border-border`
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to load entities</h3>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              Flagged Entities
            </h1>
            <p className="text-gray-600">
              Review and manage entities flagged as potential scams
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/dashboard/reports/new">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search entities by name, type, or risk score..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Entity['status'])}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="alleged">Alleged</option>
                <option value="confirmed">Confirmed</option>
                <option value="disputed">Disputed</option>
                <option value="cleared">Cleared</option>
              </select>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entities</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalEntities || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.highRisk || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.underReview || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Community Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.communityReports || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entities</CardTitle>
          <CardDescription>
            {entities.length} of {totalEntities} entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading entities...</p>
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entities found</h3>
              <p className="text-gray-600 mb-6">
                When entities are flagged as potential scams, they will appear here for review.
              </p>
              <div className="flex justify-center space-x-3">
                <Link href="/dashboard/reports/new">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Report a Scam
                  </Button>
                </Link>
                <Link href="/dashboard/search">
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search Registry
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entities.map((entity) => {
                    const riskInfo = formatRiskScore(entity.riskScore)
                    return (
                      <tr key={entity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entity.displayName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {entity.tags.join(', ')}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskInfo.bgColor} ${riskInfo.color}`}>
                            {entity.riskScore} - {riskInfo.label}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entity.reportCount} reports
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entity.status)}`}>
                            {getStatusIcon(entity.status)}
                            <span className="ml-1 capitalize">{entity.status}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <div className="relative">
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
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
      {totalEntities > 20 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalEntities)} of {totalEntities} results
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
              disabled={page * 20 >= totalEntities}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
