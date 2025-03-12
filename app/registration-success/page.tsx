"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CheckCircle, Loader2 } from "lucide-react"
import { createClientBrowser } from "@/lib/supabase"

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
        const supabase = createClientBrowser()
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error || !data) {
          throw error
        }

        setUserData(data)
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>User information not found</CardDescription>
          </CardHeader>
          <CardContent>
            <p>We couldn't find your registration information. Please try registering again.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/register")} className="w-full">
              Back to Registration
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Registration Successful!</CardTitle>
          <CardDescription>Your registration for the NAPPS Conference has been completed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Participant ID:</span>
              <span>{userData.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{userData.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Phone:</span>
              <span>{userData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Status:</span>
              <span className={userData.payment_status === "paid" ? "text-green-600" : "text-amber-600"}>
                {userData.payment_status === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
          </div>

          <div className="text-center text-sm">
            <p>Please save your Participant ID for future reference.</p>
            <p className="mt-2">You can now login to your dashboard using your phone number.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
          {userData.payment_status !== "paid" && (
            <Button onClick={() => router.push("/payment")} variant="outline" className="w-full">
              Complete Payment
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

