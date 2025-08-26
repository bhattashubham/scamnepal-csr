import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService, ReportFilters } from '@/lib/api/services/reports'
import { CreateReportForm, Report } from '@/types'

// Get all reports with filters
export const useReports = (
  filters?: ReportFilters,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['reports', filters, page, limit],
    queryFn: () => ReportService.getDashboardReports(filters, page, limit),
    enabled: true,
  })
}

// Get single report by ID
export const useReport = (id: string) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => ReportService.getById(id),
    enabled: !!id,
  })
}

// Get report statistics
export const useReportStats = (timeframe?: string) => {
  return useQuery({
    queryKey: ['report-stats', timeframe],
    queryFn: () => ReportService.getStats(timeframe),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get similar reports
export const useSimilarReports = (id: string) => {
  return useQuery({
    queryKey: ['similar-reports', id],
    queryFn: () => ReportService.getSimilar(id),
    enabled: !!id,
  })
}

// Create new report
export const useCreateReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateReportForm) => ReportService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report-stats'] })
    },
  })
}

// Update report
export const useUpdateReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Report> }) => 
      ReportService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// Update report status
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: Report['status']; 
      notes?: string 
    }) => ReportService.updateStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report-stats'] })
    },
  })
}

// Delete report
export const useDeleteReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ReportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report-stats'] })
    },
  })
}

// Add evidence to report
export const useAddEvidence = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => 
      ReportService.addEvidence(id, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['report-evidence', id] })
    },
  })
}

// Get report evidence
export const useReportEvidence = (id: string) => {
  return useQuery({
    queryKey: ['report-evidence', id],
    queryFn: () => ReportService.getEvidence(id),
    enabled: !!id,
  })
}

// Export reports
export const useExportReports = () => {
  return useMutation({
    mutationFn: ({ 
      filters, 
      format 
    }: { 
      filters?: ReportFilters; 
      format?: 'csv' | 'json' 
    }) => ReportService.export(filters, format),
  })
}
