'use client'

import { useRouter, useParams } from 'next/navigation'
import ReportDetails from '@/components/reports/ReportDetails'

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const handleBack = () => {
    router.push('/dashboard/reports')
  }

  if (!reportId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading report...</p>
      </div>
    )
  }

  return (
    <ReportDetails 
      reportId={reportId} 
      onBack={handleBack}
    />
  )
}
