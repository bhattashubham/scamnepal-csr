'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Phone } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  password: z.string().min(1, 'Password is required').optional(),
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: "Either email or phone number is required",
    path: ["email"],
  }
)

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: (email?: string, phoneNumber?: string) => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [registrationMethod, setRegistrationMethod] = useState<'email' | 'phone'>('email')
  const { register: registerUser, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const email = watch('email')
  const phoneNumber = watch('phoneNumber')

  const onSubmit = async (data: RegisterFormData) => {
    const success = await registerUser(
      data.email || '',
      data.phoneNumber,
      data.password
    )

    if (success) {
      // Registration successful, now need OTP verification
      onSuccess?.(data.email, data.phoneNumber)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join the community to help fight scams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registration Method Toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setRegistrationMethod('email')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              registrationMethod === 'email'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => setRegistrationMethod('phone')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              registrationMethod === 'phone'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>Phone</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {registrationMethod === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                {...register('phoneNumber')}
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password (Optional)
            </label>
            <Input
              type="password"
              placeholder="Create a password (optional)"
              {...register('password')}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use OTP authentication instead of a password
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (!email && !phoneNumber)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="text-xs text-gray-500 text-center">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-indigo-600 hover:text-indigo-800">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-indigo-600 hover:text-indigo-800">
            Privacy Policy
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
