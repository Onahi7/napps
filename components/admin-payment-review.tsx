"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Check, X, CheckCircle, Clock, AlertCircle, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface PaymentSubmission {
  id: string
  full_name: string
  email: string
  phone: string
  payment_status: string
  payment_amount: number
  created_at: string
  self_verified?: boolean
  payment_proof?: string | null
}

export function AdminPaymentReview() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/payments')
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: "Error",
        description: "Failed to load payment submissions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (phone: string) => {
    setProcessingId(phone)
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) throw new Error('Failed to verify payment')

      toast({
        title: "Success",
        description: "Payment verified successfully"
      })

      // Update the submission status
      setSubmissions(prev => prev.map(s => 
        s.phone === phone 
          ? { ...s, payment_status: 'completed' }
          : s
      ))
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (phone: string) => {
    setProcessingId(phone)
    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) throw new Error('Failed to reject payment')

      toast({
        title: "Success",
        description: "Payment rejected"
      })

      // Update the submission status
      setSubmissions(prev => prev.map(s => 
        s.phone === phone 
          ? { ...s, payment_status: 'pending', payment_proof: null }
          : s
      ))
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading submissions...</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No payment submissions to review
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {submissions.filter(s => s.payment_status === 'proof_submitted').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {submissions.filter(s => s.payment_status === 'proof_submitted').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onVerify={handleVerify}
                onReject={handleReject}
                processing={processingId === submission.phone}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-4 md:grid-cols-2">
            {submissions
              .filter(s => s.payment_status === 'proof_submitted')
              .map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  processing={processingId === submission.phone}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SubmissionCardProps {
  submission: PaymentSubmission
  onVerify: (phone: string) => void
  onReject: (phone: string) => void
  processing: boolean
}

function SubmissionCard({ submission, onVerify, onReject, processing }: SubmissionCardProps) {
  return (
    <Card key={submission.id}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{submission.full_name}</p>
              <p className="text-sm text-muted-foreground">{submission.phone}</p>
            </div>
            {submission.payment_status === 'completed' ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            ) : submission.payment_status === 'proof_submitted' ? (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending Review
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>

          {submission.payment_proof && (
            <div className="mt-2">
              <Label className="mb-2 block">Payment Proof</Label>
              {submission.payment_proof.endsWith('.pdf') ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    if (submission.payment_proof) {
                      window.open(submission.payment_proof, '_blank')
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              ) : (
                <AspectRatio ratio={16/9}>
                  <Image
                    src={submission.payment_proof}
                    alt="Payment proof"
                    fill
                    className="rounded-md object-cover"
                  />
                </AspectRatio>
              )}
            </div>
          )}

          {submission.payment_status === 'proof_submitted' && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => onVerify(submission.phone)}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onReject(submission.phone)}
                disabled={processing}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}