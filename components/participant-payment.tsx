"use client"

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PaymentStatus } from '@prisma/client'

interface PaymentProps {
  amount: number
  phoneNumber: string
  status: PaymentStatus
  proofUrl?: string | null
}

export function ParticipantPayment({ amount, status }: PaymentProps) {
  const router = useRouter()

  if (status === 'COMPLETED') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="ml-2">
              Your payment has been verified and approved
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (status === 'PROOF_SUBMITTED') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Your payment proof has been submitted and is under review. You will be notified once it is approved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Default view for PENDING status
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Required</CardTitle>
        <CardDescription>
          Please complete your registration payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold">₦{amount?.toLocaleString() ?? '0'}</div>
        <Button 
          className="w-full" 
          onClick={() => router.push('/payment')}
        >
          Pay Now
        </Button>
      </CardContent>
    </Card>
  )
}