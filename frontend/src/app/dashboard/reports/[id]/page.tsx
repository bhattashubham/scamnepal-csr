'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Download,
  Eye,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useReport, useUpdateReportStatus, useSimilarReports } from '@/hooks/useReports'
import { formatCurrency, formatRelativeTime, formatRiskScore, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

export default function ReportDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // Get the ID from the URL path
  const pathSegments = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
  const reportId = pathSegments[pathSegments.length - 1]

  const { data: reportData, isLoading, error } = useReport(reportId)
  const { data: similarReportsData } = useSimilarReports(reportId)
  const updateStatusMutation = useUpdateReportStatus()

  const report = reportData?.data
  const similarReports = similarReportsData?.data || []

  const isModerator = user?.role === 'moderator' || user?.role === 'admin'
  const isReportOwner = user?.id === report?.reporterUserId

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'under_review':
        return <AlertTriangle className="h-5 w-5 text-blue-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'under_review':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: reportId,
        status: newStatus as any,
        notes: `Status updated to ${newStatus} by ${user?.email}`
      })
      setShowStatusModal(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading report details...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
          <p className="text-gray-600 mb-4">The report you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const riskInfo = formatRiskScore(report.riskScore)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
              <p className="text-gray-600">
                Submitted {formatRelativeTime(report.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            {(isReportOwner || isModerator) && (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {isModerator && (
              <Button 
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
                  {report.category}
                </CardTitle>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                  <span className="ml-2 capitalize">{report.status.replace('_', ' ')}</span>
                </div>
              </div>
              <CardDescription>
                Report ID: {report.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Identifier Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-16">Type:</span>
                      <span className="text-sm font-medium">{report.identifierType}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-16">Value:</span>
                      <span className="text-sm font-medium font-mono bg-gray-100 px-2 py-1 rounded">
                        {report.identifierValue}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${riskInfo.bgColor} ${riskInfo.color}`}>
                    <span className="text-lg font-bold mr-2">{report.riskScore}</span>
                    <span className="font-medium">{riskInfo.label} Risk</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Amount Lost</p>
                      <p className="font-medium">
                        {formatCurrency(report.amountLost, report.currency)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Incident Date</p>
                      <p className="font-medium">{formatDate(report.incidentDate)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Channel</p>
                      <p className="font-medium">{report.incidentChannel}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Report Status</p>
                      <p className="font-medium capitalize">{report.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Narrative */}
          <Card>
            <CardHeader>
              <CardTitle>What Happened</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{report.narrative}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence & Links */}
          {/* This would show uploaded files and suspected links */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence & Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suspected Links</h4>
                  <div className="space-y-2">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <ExternalLink className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm font-mono">https://suspicious-investment.com</span>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Evidence</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Download className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">screenshot.png</p>
                      <p className="text-xs text-gray-500">234 KB</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share Report
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          {/* Report Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Report submitted</p>
                    <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Under review</p>
                    <p className="text-xs text-gray-500">{formatDate(report.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Reports */}
          {similarReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Reports</CardTitle>
                <CardDescription>
                  {similarReports.length} reports with similar patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {similarReports.slice(0, 3).map((similar) => (
                    <div key={similar.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{similar.category}</p>
                          <p className="text-xs text-gray-500">{similar.identifierValue}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Report Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-medium">47</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Similar Reports</span>
                  <span className="text-sm font-medium">{similarReports.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="text-sm font-medium">{report.riskScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Report Status</h3>
            <div className="space-y-3">
              {['pending', 'under_review', 'verified', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updateStatusMutation.isPending}
                  className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 ${
                    report.status === status ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    {getStatusIcon(status)}
                    <span className="ml-3 capitalize">{status.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
