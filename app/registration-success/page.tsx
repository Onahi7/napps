"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CheckCircle, Loader2 } from "lucide-react"
import { getMyProfile } from "@/actions/profile-actions"

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        router.push("/register")
        return
      }
      try {
        const profile = await getMyProfile()
        if (!profile) {
          throw new Error("Profile not found")
        }
        setUserData(profile)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-napps-gold" />
          <p className="text-muted-foreground">Loading registration details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Registration Successful!</CardTitle>
          <CardDescription>Your registration has been completed successfully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-2 font-medium">Registration Details:</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                {userData?.full_name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {userData?.email}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                {userData?.phone}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please complete your payment to activate your registration. You can make the payment from your dashboard.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full bg-napps-gold text-black hover:bg-napps-gold/90"
            onClick={() => router.push("/participant/dashboard")}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

