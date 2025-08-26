'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
})

type OTPFormData = z.infer<typeof otpSchema>

interface OTPFormProps {
  email?: string
  phoneNumber?: string
  onSuccess?: () => void
  onBack?: () => void
}

export function OTPForm({ email, phoneNumber, onSuccess, onBack }: OTPFormProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  const { verifyOTP, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  const otpValue = watch('otp')

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpValue && otpValue.length === 6) {
      handleSubmit(onSubmit)()
    }
  }, [otpValue])

  const onSubmit = async (data: OTPFormData) => {
    const success = await verifyOTP(email, phoneNumber, data.otp)
    if (success) {
      onSuccess?.()
    }
  }

  const handleResendOTP = () => {
    // TODO: Implement resend OTP functionality
    setTimeLeft(300)
    setCanResend(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOTPInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setValue('otp', value)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-6 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <CardTitle>Verify Your Identity</CardTitle>
        </div>
        <CardDescription>
          Enter the 6-digit code sent to{' '}
          <span className="font-medium">
            {email || phoneNumber}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Verification Code
            </label>
            <Input
              type="text"
              placeholder="000000"
              {...register('otp')}
              onChange={handleOTPInput}
              className={`text-center text-2xl font-mono tracking-widest ${
                errors.otp ? 'border-red-500' : ''
              }`}
              maxLength={6}
              autoComplete="one-time-code"
            />
            {errors.otp && (
              <p className="text-sm text-red-600 mt-1 text-center">{errors.otp.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !otpValue || otpValue.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600">
              Code expires in {formatTime(timeLeft)}
            </p>
          ) : (
            <p className="text-sm text-red-600">
              Code has expired
            </p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOTP}
            disabled={!canResend}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>Didn't receive the code?</p>
          <p>Check your spam folder or try resending</p>
        </div>
      </CardContent>
    </Card>
  )
}
