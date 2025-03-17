"use client"

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, Copy, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useSession } from "next-auth/react"

interface PaymentProps {
  amount: number
  phoneNumber: string
  status: 'pending' | 'proof_submitted' | 'completed'
  proofUrl?: string | null
}

export function ParticipantPayment({ amount, phoneNumber, status }: PaymentProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        description: "Text copied to clipboard",
      })
    } catch (error) {
      toast({
        description: "Failed to copy text",
        variant: "destructive"
      })
    }
  }

  const handleNotifyAdmin = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhone: phoneNumber })
      })

      if (!response.ok) {
        throw new Error('Failed to notify admin')
      }

      toast({
        title: "Success",
        description: "Admin has been notified of your payment proof submission",
      })

      // Refresh the page to update status
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to notify admin",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Payment completed successfully
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (status === 'proof_submitted') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment proof has been submitted and is pending review
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>
          Please make a bank transfer of ₦{amount.toLocaleString()} to the account below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Account Name</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>N.A.P.P.S. Nassarawa State</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('N.A.P.P.S. Nassarawa State')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Bank</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>Unity Bank</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('Unity Bank')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Account Number</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>0017190877</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('0017190877')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Amount</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>₦{amount.toLocaleString()}</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(amount.toString())}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please include your phone number ({phoneNumber}) in the transfer narration/reference
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            After making the transfer, click the button below to send your payment proof via WhatsApp.
          </AlertDescription>
        </Alert>

      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button 
          className="w-full"
          onClick={() => {
            const message = `Hello, I have made payment for NAPPS Summit registration.\n*Full Name:* ${session?.user?.name}\n*Phone:* ${phoneNumber}\n*Account Used:* Unity Bank - 0017190877`;
            window.open(`https://wa.me/2348030822969?text=${encodeURIComponent(message)}`, '_blank');
          }}
        >
          Send Payment Proof on WhatsApp
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleNotifyAdmin}
          disabled={submitting || isPending}
        >
          {(submitting || isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            "I've sent the proof on WhatsApp"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}