"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { verifyRegistrationPayment, verifyHotelBookingPayment } from "@/actions/payment-actions"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function PaymentVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const trxref = searchParams.get("trxref")
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [error, setError] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<"registration" | "hotel" | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !trxref) {
        setStatus("failed")
        setError("No payment reference found")
        return
      }

      const paymentRef = reference || trxref

      try {
        // Try to verify as registration payment first
        const result = await verifyRegistrationPayment(paymentRef!)

        if (result.success) {
          setPaymentType("registration")
          setStatus(result.status === "paid" ? "success" : "failed")
        } else {
          // If not a registration payment, try as hotel booking payment
          const hotelResult = await verifyHotelBookingPayment(paymentRef!)

          if (hotelResult.success) {
            setPaymentType("hotel")
            setStatus(hotelResult.status === "paid" ? "success" : "failed")
          } else {
            setStatus("failed")
            setError(hotelResult.error || "Payment verification failed")
          }
        }
      } catch (err: any) {
        setStatus("failed")
        setError(err.message || "An error occurred during payment verification")
      }
    }

    verifyPayment()
  }, [reference, trxref])

  const handleContinue = () => {
    if (paymentType === "registration") {
      router.push("/participant/dashboard")
    } else if (paymentType === "hotel") {
      router.push("/participant/accommodation")
    } else {
      router.push("/participant/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>Verifying your payment status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-lg font-medium">Verifying your payment...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-lg font-medium">Payment Successful!</p>
              <p className="text-center text-sm text-muted-foreground">
                {paymentType === "registration"
                  ? "Your conference registration is now complete."
                  : "Your hotel booking has been confirmed."}
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-lg font-medium">Payment Failed</p>
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            {status === "success" ? "Continue to Dashboard" : "Return to Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

