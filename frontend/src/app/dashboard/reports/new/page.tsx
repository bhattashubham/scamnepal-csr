'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateReport } from '@/hooks/useReports'
import { CreateReportForm } from '@/types'
import { ReportService } from '@/lib/api/services/reports'

const reportSchema = z.object({
  identifierType: z.string().min(1, 'Identifier type is required'),
  identifierValue: z.string().min(1, 'Identifier value is required'),
  scamCategory: z.string().min(1, 'Scam category is required'),
  amountLost: z.number().min(0, 'Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentChannel: z.string().min(1, 'Incident channel is required'),
  narrative: z.string().min(10, 'Description must be at least 10 characters'),
  contactMethod: z.string().min(1, 'Contact method is required'),
  suspectedLinks: z.array(z.string()),
  additionalInfo: z.record(z.string(), z.any()).optional(),
})

type ReportFormData = z.infer<typeof reportSchema>

const identifierTypes = [
  'Phone Number',
  'Email Address',
  'Website URL',
  'Social Media Profile',
  'Bank Account',
  'UPI ID',
  'Cryptocurrency Address',
  'Company Name',
  'Person Name',
  'Other'
]

const scamCategories = [
  'Investment Fraud',
  'Romance Scam',
  'Tech Support Scam',
  'Phishing',
  'Online Shopping Fraud',
  'Cryptocurrency Scam',
  'Loan Scam',
  'Job/Employment Scam',
  'Lottery/Prize Scam',
  'Identity Theft',
  'Fake Charity',
  'Real Estate Fraud',
  'Other'
]

const incidentChannels = [
  'Phone Call',
  'SMS/Text',
  'Email',
  'WhatsApp',
  'Telegram',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'Dating App',
  'Website',
  'In Person',
  'Other'
]

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'BTC', 'ETH']

export default function NewReportPage() {
  const router = useRouter()
  const [suspectedLinks, setSuspectedLinks] = useState<string[]>([''])
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createReportMutation = useCreateReport()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      currency: 'INR',
      suspectedLinks: [''],
      amountLost: 0,
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: ReportFormData) => {
    try {
      const reportData: CreateReportForm = {
        ...data,
        suspectedLinks: suspectedLinks.filter(link => link.trim() !== ''),
        additionalInfo: {
          filesUploaded: files.length,
          submissionSource: 'web_dashboard',
        }
      }

      const result = await createReportMutation.mutateAsync(reportData)
      
      if (result.success && result.data && files.length > 0) {
        // Upload files if any were selected
        try {
          await ReportService.addEvidence(result.data.id, files)
          console.log('Files uploaded successfully')
        } catch (uploadError) {
          console.error('Failed to upload files:', uploadError)
          // Don't fail the whole submission if file upload fails
        }
      }
      
      if (result.success) {
        router.push('/dashboard/reports')
      }
    } catch (error) {
      console.error('Failed to create report:', error)
    }
  }

  const addSuspectedLink = () => {
    setSuspectedLinks([...suspectedLinks, ''])
  }

  const removeSuspectedLink = (index: number) => {
    setSuspectedLinks(suspectedLinks.filter((_, i) => i !== index))
  }

  const updateSuspectedLink = (index: number, value: string) => {
    const newLinks = [...suspectedLinks]
    newLinks[index] = value
    setSuspectedLinks(newLinks)
    setValue('suspectedLinks', newLinks)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered:', event.target.files);
    const selectedFiles = Array.from(event.target.files || [])
    console.log('Selected files:', selectedFiles);
    
    // Validate file sizes (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 15MB.`);
        return false;
      }
      return true;
    });
    
    // Validate file types
    const allowedTypes = [
      'image/', 'video/', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];
    
    const typeValidFiles = validFiles.filter(file => {
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        alert(`File "${file.name}" has an unsupported type. Please upload images, videos, PDFs, or documents.`);
        return false;
      }
      return true;
    });
    
    console.log('Valid files to add:', typeValidFiles);
    setFiles([...files, ...typeValidFiles]);
    
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['identifierType', 'identifierValue', 'scamCategory']
      : ['amountLost', 'currency', 'incidentDate', 'incidentChannel']
    
    const isValid = await trigger(fieldsToValidate as any)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(Math.max(1, step - 1))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report a Scam</h1>
            <p className="text-gray-600">
              Help protect others by sharing your experience
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber <= step 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              <span className={`ml-2 text-sm ${
                stepNumber <= step ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                {stepNumber === 1 && 'Basic Info'}
                {stepNumber === 2 && 'Incident Details'}
                {stepNumber === 3 && 'Additional Information'}
              </span>
              {stepNumber < 3 && (
                <div className={`mx-4 h-0.5 w-16 ${
                  stepNumber < step ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
              <CardDescription>
                Tell us about the scammer's identifier and category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifier Type *
                  </label>
                  <select
                    {...register('identifierType')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select identifier type</option>
                    {identifierTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.identifierType && (
                    <p className="text-sm text-red-600 mt-1">{errors.identifierType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifier Value *
                  </label>
                  <Input
                    {...register('identifierValue')}
                    placeholder="e.g., +91-9876543210, scammer@email.com"
                    className={errors.identifierValue ? 'border-red-500' : ''}
                  />
                  {errors.identifierValue && (
                    <p className="text-sm text-red-600 mt-1">{errors.identifierValue.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scam Category *
                </label>
                <select
                  {...register('scamCategory')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select scam category</option>
                  {scamCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.scamCategory && (
                  <p className="text-sm text-red-600 mt-1">{errors.scamCategory.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Incident Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Incident Details</CardTitle>
              <CardDescription>
                Provide details about when and how the scam occurred
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Lost *
                  </label>
                  <Input
                    type="number"
                    {...register('amountLost', { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={errors.amountLost ? 'border-red-500' : ''}
                  />
                  {errors.amountLost && (
                    <p className="text-sm text-red-600 mt-1">{errors.amountLost.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    {...register('currency')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Date *
                  </label>
                  <Input
                    type="date"
                    {...register('incidentDate')}
                    className={errors.incidentDate ? 'border-red-500' : ''}
                  />
                  {errors.incidentDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.incidentDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Channel *
                  </label>
                  <select
                    {...register('incidentChannel')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select channel</option>
                    {incidentChannels.map((channel) => (
                      <option key={channel} value={channel}>{channel}</option>
                    ))}
                  </select>
                  {errors.incidentChannel && (
                    <p className="text-sm text-red-600 mt-1">{errors.incidentChannel.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How They Contacted You *
                </label>
                <select
                  {...register('contactMethod')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select contact method</option>
                  {incidentChannels.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                {errors.contactMethod && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactMethod.message}</p>
                )}
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Information */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Additional Information</CardTitle>
              <CardDescription>
                Provide more details to help others identify this scam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  {...register('narrative')}
                  rows={6}
                  placeholder="Describe what happened, how the scammer approached you, what they said, and any other relevant details..."
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.narrative ? 'border-red-500' : ''
                  }`}
                />
                {errors.narrative && (
                  <p className="text-sm text-red-600 mt-1">{errors.narrative.message}</p>
                )}
              </div>

              {/* Suspected Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspected Links or URLs (Optional)
                </label>
                <div className="space-y-2">
                  {suspectedLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={link}
                        onChange={(e) => updateSuspectedLink(index, e.target.value)}
                        placeholder="https://suspicious-website.com"
                      />
                      {suspectedLinks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSuspectedLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSuspectedLink}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Link
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Files (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload screenshots, messages, or other evidence
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Supported: Images, Videos, PDFs, Documents (Max: 15MB per file)
                  </p>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  {/* Clickable button that triggers file input */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Choose Files button clicked');
                      console.log('File input ref:', fileInputRef.current);
                      if (fileInputRef.current) {
                        console.log('Triggering file input click via ref');
                        fileInputRef.current.click();
                      } else {
                        console.error('File input ref not found');
                      }
                    }}
                  >
                    Choose Files
                  </Button>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={createReportMutation.isPending}
                  className="min-w-32"
                >
                  {createReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Error Display */}
      {createReportMutation.error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">
                Failed to submit report. Please try again.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
