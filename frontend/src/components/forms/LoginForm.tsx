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

const loginSchema = z.object({
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

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  onSwitchToOTP?: (email?: string, phoneNumber?: string) => void
}

export function LoginForm({ onSuccess, onSwitchToRegister, onSwitchToOTP }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const { login, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const email = watch('email')
  const phoneNumber = watch('phoneNumber')

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(
      data.email || '',
      data.password,
      data.phoneNumber
    )

    if (success) {
      onSuccess?.()
    }
  }

  const handleOTPLogin = () => {
    if (loginMethod === 'email' && email) {
      onSwitchToOTP?.(email, undefined)
    } else if (loginMethod === 'phone' && phoneNumber) {
      onSwitchToOTP?.(undefined, phoneNumber)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Login Method Toggle */}
        <div className="flex rounded-lg border border-input p-1 bg-muted/50">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'phone'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>Phone</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {loginMethod === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                {...register('phoneNumber')}
                className={errors.phoneNumber ? 'border-destructive' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password (Optional)
            </label>
            <Input
              type="password"
              placeholder="Enter your password (optional)"
              {...register('password')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to receive an OTP instead
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOTPLogin}
              disabled={(!email && !phoneNumber) || isLoading}
            >
              Send OTP Instead
            </Button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
