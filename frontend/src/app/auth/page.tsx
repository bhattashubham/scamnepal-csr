'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { LoginForm } from '@/components/forms/LoginForm'
import { RegisterForm } from '@/components/forms/RegisterForm'
import { OTPForm } from '@/components/forms/OTPForm'

type AuthStep = 'login' | 'register' | 'otp'

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login')
  const [otpData, setOtpData] = useState<{
    email?: string
    phoneNumber?: string
  }>({})
  const router = useRouter()

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  const handleRegisterSuccess = (email?: string, phoneNumber?: string) => {
    setOtpData({ email, phoneNumber })
    setStep('otp')
  }

  const handleSwitchToOTP = (email?: string, phoneNumber?: string) => {
    setOtpData({ email, phoneNumber })
    setStep('otp')
  }

  const handleBackToAuth = () => {
    setStep('login')
    setOtpData({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-medium">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Community Scam Registry</h1>
          <p className="text-muted-foreground mt-2">
            Protecting communities through shared knowledge
          </p>
        </div>

        {/* Auth Forms */}
        {step === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setStep('register')}
            onSwitchToOTP={handleSwitchToOTP}
          />
        )}

        {step === 'register' && (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setStep('login')}
          />
        )}

        {step === 'otp' && (
          <OTPForm
            email={otpData.email}
            phoneNumber={otpData.phoneNumber}
            onSuccess={handleAuthSuccess}
            onBack={handleBackToAuth}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
