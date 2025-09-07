/**
 * Evidence Viewer Component
 * Displays evidence files with preview and download functionality
 */

import React, { useState } from 'react'
import { EvidenceFile } from '@/types'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Image, 
  Video, 
  File, 
  Download, 
  Eye, 
  X,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  FileSpreadsheet
} from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { getImageUrl } from '@/lib/config'
import { getFileTypeColors } from '@/lib/theme-utils'

interface EvidenceViewerProps {
  evidenceFiles: EvidenceFile[]
  className?: string
}

export function EvidenceViewer({ evidenceFiles, className }: EvidenceViewerProps) {
  const [selectedFile, setSelectedFile] = useState<EvidenceFile | null>(null)

  if (!evidenceFiles || evidenceFiles.length === 0) {
    return null
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return FileAudio
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive
    return FileText
  }

  const getFileTypeColor = (mimeType: string) => {
    return getFileTypeColors(mimeType)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeDisplay = (mimeType: string) => {
    // Handle common MIME types with user-friendly names
    if (mimeType.startsWith('image/')) return 'IMAGE'
    if (mimeType.startsWith('video/')) return 'VIDEO'
    if (mimeType.startsWith('audio/')) return 'AUDIO'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('wordprocessingml.document') || mimeType.includes('msword')) return 'DOCX'
    if (mimeType.includes('spreadsheetml.sheet') || mimeType.includes('excel')) return 'XLSX'
    if (mimeType.includes('presentationml.presentation') || mimeType.includes('powerpoint')) return 'PPTX'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ARCHIVE'
    if (mimeType.includes('text/')) return 'TEXT'
    
    // Fallback to extracting from MIME type
    const extension = mimeType.split('/')[1]?.toUpperCase()
    return extension || 'FILE'
  }

  const handleDownload = (file: EvidenceFile) => {
    const link = document.createElement('a')
    link.href = getImageUrl(file.storageUrl) || file.storageUrl
    link.download = file.fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = (file: EvidenceFile) => {
    setSelectedFile(file)
  }

  const isImageFile = (mimeType: string) => mimeType.startsWith('image/')
  const isVideoFile = (mimeType: string) => mimeType.startsWith('video/')
  const isDocumentFile = (mimeType: string) => 
    mimeType.includes('pdf') || 
    mimeType.includes('wordprocessingml.document') || 
    mimeType.includes('msword') ||
    mimeType.includes('spreadsheetml.sheet') ||
    mimeType.includes('presentationml.presentation') ||
    mimeType.includes('text/')

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Evidence Files</h3>
        <Badge variant="secondary" className="text-xs">
          {evidenceFiles.length} file{evidenceFiles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Evidence Files - List View Only */}
      <div className="space-y-2">
        {evidenceFiles.map((file) => {
          const Icon = getFileIcon(file.mimeType)
          const typeColor = getFileTypeColor(file.mimeType)
          
          return (
            <Card key={file.id} className="group hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {/* File Icon */}
                  <div className={cn("p-2 rounded-lg", typeColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {file.fileName}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeDisplay(file.mimeType)}
                      </Badge>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{selectedFile.fileName}</CardTitle>
                <CardDescription>
                  {formatFileSize(selectedFile.fileSize)} • {selectedFile.mimeType}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-[70vh] overflow-auto">
                {isImageFile(selectedFile.mimeType) ? (
                  <img
                    src={getImageUrl(selectedFile.storageUrl) || selectedFile.storageUrl}
                    alt={selectedFile.fileName}
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : isVideoFile(selectedFile.mimeType) ? (
                  <video
                    src={getImageUrl(selectedFile.storageUrl) || selectedFile.storageUrl}
                    controls
                    className="w-full h-auto"
                  />
                ) : isDocumentFile(selectedFile.mimeType) ? (
                  <div className="h-96">
                    <iframe
                      src={getImageUrl(selectedFile.storageUrl) || selectedFile.storageUrl}
                      className="w-full h-full border-0"
                      title={selectedFile.fileName}
                      onError={() => {
                        // Fallback to download option if iframe fails
                        const iframe = document.querySelector('iframe')
                        if (iframe) {
                          iframe.style.display = 'none'
                          iframe.nextElementSibling?.classList.remove('hidden')
                        }
                      }}
                    />
                    <div className="hidden flex items-center justify-center h-full bg-muted">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground mb-2">Document preview not available</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          This document type cannot be previewed in the browser
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(selectedFile)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download to view
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Preview not available for this file type</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleDownload(selectedFile)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
