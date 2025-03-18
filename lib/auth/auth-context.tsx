import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  hasCompletedPayment: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  completePayment: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function checkAuth() {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setUser(null)
        return
      }

      // Validate token with your backend
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Invalid session')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('authToken')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function login(email: string, password: string) {
    try {
      // Add your login API call here
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const { token, user } = await response.json()
      localStorage.setItem('authToken', token)
      setUser(user)
    } catch (error) {
      throw new Error('Login failed')
    }
  }

  async function logout() {
    try {
      // Call logout endpoint to invalidate token
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('authToken')
      setUser(null)
    }
  }

  async function signup(email: string, password: string, name: string) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        throw new Error('Signup failed')
      }

      const { token, user } = await response.json()
      localStorage.setItem('authToken', token)
      setUser({ ...user, hasCompletedPayment: false })

      // Redirect to payment page
      window.location.href = '/payment'
    } catch (error) {
      throw new Error('Signup failed')
    }
  }

  async function completePayment() {
    try {
      const response = await fetch('/api/payment/complete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })

      if (!response.ok) {
        throw new Error('Payment failed')
      }

      setUser(prev => prev ? { ...prev, hasCompletedPayment: true } : null)
    } catch (error) {
      throw new Error('Payment failed')
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    completePayment
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
