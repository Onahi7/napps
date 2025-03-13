import { useSession, signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  const login = async (email: string, password: string, isAdmin: boolean = false) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        isAdmin: isAdmin.toString(),
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: result.error }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, error: error.message || "Login failed" }
    }
  }

  const register = async (userData: {
    email: string
    password: string
    full_name: string
    phone: string
    state?: string
    lga?: string
    chapter?: string
    organization?: string
    position?: string
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto login after successful registration
      const loginResult = await login(userData.email, userData.password)
      if (!loginResult.success) {
        throw new Error('Auto login after registration failed')
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  return {
    user: session?.user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  }
}