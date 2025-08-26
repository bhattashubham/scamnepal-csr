import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { AuthService } from '@/lib/api/services/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

interface AuthActions {
  login: (email: string, password?: string, phoneNumber?: string) => Promise<boolean>
  register: (email: string, phoneNumber?: string, password?: string) => Promise<boolean>
  verifyOTP: (email: string | undefined, phoneNumber: string | undefined, otp: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  getProfile: () => Promise<void>
  setUser: (user: User) => void
  setToken: (token: string) => void
  setError: (error: string | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Initialize auth state from stored token
      initialize: async () => {
        console.log('🔐 Auth Store: Initializing...')
        const storedToken = AuthService.getToken()
        
        if (storedToken) {
          console.log('🔐 Auth Store: Found stored token, restoring session')
          set({ token: storedToken, isAuthenticated: true, isLoading: true })
          
          try {
            // Try to get user profile with stored token
            const response = await AuthService.getProfile()
            if (response.success && response.data) {
              set({
                user: response.data,
                isLoading: false,
                isInitialized: true
              })
              console.log('🔐 Auth Store: Session restored successfully')
            } else {
              // Token is invalid, clear it
              console.log('🔐 Auth Store: Stored token is invalid, clearing')
              set({
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true
              })
              AuthService.removeToken()
            }
          } catch (error) {
            console.log('🔐 Auth Store: Error restoring session, clearing token')
            set({
              token: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true
            })
            AuthService.removeToken()
          }
        } else {
          console.log('🔐 Auth Store: No stored token found')
          set({ isInitialized: true })
        }
      },

      // Actions
      login: async (email: string, password?: string, phoneNumber?: string) => {
        console.log('🔐 Auth Store: Login attempt started', { email, phoneNumber })
        set({ isLoading: true, error: null })
        
        try {
          const response = await AuthService.login({ email, password, phoneNumber })
          console.log('🔐 Auth Store: Login response received', response)
          
          if (response.success && response.data) {
            const { token, user } = response.data
            console.log('🔐 Auth Store: Login successful, setting state', { token: token?.substring(0, 20) + '...', user })
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            AuthService.saveToken(token)
            console.log('🔐 Auth Store: Token saved, state updated')
            return true
          } else {
            console.log('🔐 Auth Store: Login failed', response.error)
            set({
              error: response.error?.message || 'Login failed',
              isLoading: false
            })
            return false
          }
        } catch (error: any) {
          console.error('🔐 Auth Store: Login error', error)
          set({
            error: error.message || 'Login failed',
            isLoading: false
          })
          return false
        }
      },

      register: async (email: string, phoneNumber?: string, password?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await AuthService.register({ email, phoneNumber, password })
          
          if (response.success) {
            set({ isLoading: false, error: null })
            return true
          } else {
            set({
              error: response.error?.message || 'Registration failed',
              isLoading: false
            })
            return false
          }
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false
          })
          return false
        }
      },

      verifyOTP: async (email: string | undefined, phoneNumber: string | undefined, otp: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await AuthService.verifyOTP({ email, phoneNumber, otp })
          
          if (response.success && response.data) {
            const { token, user } = response.data
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            AuthService.saveToken(token)
            return true
          } else {
            set({
              error: response.error?.message || 'OTP verification failed',
              isLoading: false
            })
            return false
          }
        } catch (error: any) {
          set({
            error: error.message || 'OTP verification failed',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        AuthService.removeToken()
        AuthService.logout() // Call API to invalidate token
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return false
        
        try {
          const response = await AuthService.refreshToken(token)
          
          if (response.success && response.data) {
            const { token: newToken, user } = response.data
            
            set({
              user,
              token: newToken,
              isAuthenticated: true
            })
            
            AuthService.saveToken(newToken)
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          get().logout()
          return false
        }
      },

      getProfile: async () => {
        set({ isLoading: true })
        
        try {
          const response = await AuthService.getProfile()
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          set({ isLoading: false })
        }
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token, isAuthenticated: true }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
)
