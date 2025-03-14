"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { Icons } from "@/components/icons"
import { initializePayment } from "@/actions/payment-actions"
import { Loader2 } from "lucide-react"

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrationAmount] = useState(15000) // This will be fetched from config in production

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handlePaymentSetup = async () => {
    setIsInitializing(true)
    setError(null)
    try {
      const { reference } = await initializePayment(registrationAmount)
      if (reference) {
        router.push(`/payment?reference=${reference}`)
      } else {
        throw new Error("Failed to initialize payment")
      }
    } catch (err: any) {
      console.error("Payment setup error:", err)
      setError(err.message || "Failed to set up payment")
    } finally {
      setIsInitializing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <h1 className="text-2xl font-semibold tracking-tight">Registration Successful!</h1>
          <p className="text-sm text-muted-foreground">Please proceed to make your payment</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Registration Details:</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {session.user.full_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {session.user.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {session.user.phone}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please proceed to make your bank transfer using the unique reference code that will be provided.
                  Make sure to include your reference code in your transfer narration.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full bg-napps-gold text-black hover:bg-napps-gold/90"
              onClick={handlePaymentSetup}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up payment...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/participant/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

