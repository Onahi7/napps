"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { CheckCircle } from "lucide-react"

export default function RegistrationSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">Registration Successful!</h1>
          <p className="text-sm text-muted-foreground">Your registration has been completed.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-napps-gold/30 bg-napps-gold/10 p-4">
                <p className="text-sm text-center">
                  Redirecting you to login... Please wait.
                  <br />
                  After logging in, you can complete your payment and upload your payment proof.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

