"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { School } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Helper function to get the appropriate dashboard path
const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'VALIDATOR':
      return '/validator/dashboard'
    default:
      return '/participant/dashboard'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || undefined
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams?.get('error') || null)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const dashboardPath = session.user.role === 'ADMIN' 
        ? '/admin/dashboard'
        : session.user.role === 'VALIDATOR'
          ? '/validator/dashboard'
          : '/participant/dashboard'
      router.replace(dashboardPath)
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Use direct redirection instead of manual handling
      const targetUrl = getDashboardPath(
        isAdminLogin ? "ADMIN" : "PARTICIPANT" // Default assumption based on login type
      )
      
      const result = await signIn("credentials", {
        identifier: loginMethod === "email" ? email : phone,
        password: isAdminLogin ? password : "",
        loginMethod,
        isAdmin: isAdminLogin.toString(),
        redirect: true,
        callbackUrl: targetUrl
      })
      
      // We won't reach here if redirect: true is used, but keeping as fallback
      if (result?.error) {
        setError("Invalid credentials. Please try again.")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An error occurred during login")
      setIsLoading(false)
    }
  }

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Don't show login form if already authenticated
  if (status === 'authenticated') {
    return null
  }

  // Render login form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="absolute left-4 top-4">
        <Link href="/" className="flex items-center gap-2">
          <School className="h-6 w-6 text-napps-green" />
          <span className="font-semibold text-napps-green">NAPPS Conference</span>
        </Link>
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your NAPPS Conference account</p>
        </div>

        <Card className="border-napps-gold/30 card-glow">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Choose how you want to sign in</CardDescription>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="admin-login"
                  checked={isAdminLogin}
                  onChange={() => {
                    setIsAdminLogin(!isAdminLogin)
                    setError(null)
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-napps-gold focus:ring-napps-gold"
                />
                <Label htmlFor="admin-login" className="text-sm">Admin Login</Label>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Tabs defaultValue="email" onValueChange={(value) => setLoginMethod(value as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="phone">Phone Number</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={loginMethod === "email"}
                      className="border-napps-gold/30 focus-visible:ring-napps-gold"
                      disabled={isLoading}
                    />
                  </div>
                  
                  {isAdminLogin && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-xs text-napps-gold hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={isAdminLogin}
                        className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={loginMethod === "phone"}
                      className="border-napps-gold/30 focus-visible:ring-napps-gold"
                      disabled={isLoading}
                    />
                  </div>
                  {isAdminLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="password-phone">Password</Label>
                      <Input
                        id="password-phone"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={isAdminLogin}
                        className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-napps-gold text-black hover:bg-napps-gold/90 shadow-gold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/pre-register" className="text-napps-gold hover:underline">
                  Register
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
