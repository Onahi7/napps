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
    school_name: string
    school_address: string
    school_state: string
    napps_chapter: string
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
        // Pass the full response data including status code
        throw { 
          message: data.error || 'Registration failed', 
          status: response.status, 
          details: data.details 
        };
      }

      // // Auto login after successful registration - REMOVED
      // const loginResult = await login(userData.email, userData.password)
      // if (!loginResult.success) {
      //   // Even if auto-login fails, registration itself was successful
      //   // Consider how to handle this - maybe log the error but still return success?
      //   console.warn('Auto login after registration failed');
      //   // throw new Error('Auto login after registration failed')
      // }

      // Return success and the response data (which might include referenceCode)
      return { success: true, error: null, data: data };
    } catch (error: any) {
      console.error("Registration error:", error)
      // Return the structured error including status if available
      return { 
        success: false, 
        error: error.message || "Registration failed", 
        status: error.status, 
        details: error.details 
      };
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