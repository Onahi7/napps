"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Copy, Loader2 } from "lucide-react"
import { Icons } from "@/components/icons"

export default function PaymentPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccessMessage("Text copied to clipboard")
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError("Failed to copy text")
      setTimeout(() => setError(null), 2000)
    }
  }

  const handleUploadProof = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload payment proof')
      }

      setSuccessMessage("Payment proof uploaded successfully. Redirecting to dashboard...")
      
      // Redirect to the dashboard payment section
      setTimeout(() => {
        router.push("/participant/dashboard?section=payment")
      }, 2000)

    } catch (error: any) {
      console.error("Error uploading payment proof:", error)
      setError(error.message || "Failed to upload payment proof")
    } finally {
      setSubmitting(false)
    }
  }

  // Protect the route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === "loading") return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4" />

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <h1 className="text-2xl font-semibold tracking-tight">Payment Details</h1>
          <p className="text-sm text-muted-foreground">Complete your registration payment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer Details</CardTitle>
            <CardDescription>Make a transfer to the account below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Account Name</p>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>NAPPS UNITY BANK</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("NAPPS UNITY BANK")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Account Number</p>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>0017190877</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("0017190877")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Bank</p>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>Unity Bank</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("Unity Bank")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Amount</p>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>₦20,000</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("20000")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4 text-napps-gold" />
              <AlertDescription className="alert-description mt-2">
                Please include your phone number ({session?.user?.phone}) in the transfer narration/reference. After payment, upload your proof below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Payment Proof</p>
              <Input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: Images (JPEG, PNG) and PDF. Maximum size: 5MB
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full"
              onClick={handleUploadProof}
              disabled={submitting || !file}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Payment Proof"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

