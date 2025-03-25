"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, MessageSquare, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentSubmission {
  id: string
  full_name: string
  email: string
  phone: string
  payment_status: string
  payment_amount: number
  created_at: string
  self_verified?: boolean
}

export function AdminPaymentReview() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selfVerified, setSelfVerified] = useState<boolean>(false)

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

      // Update the submission status instead of removing it
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
          ? { ...s, payment_status: 'pending' }
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

  const handleSelfVerify = async (phone: string) => {
    // Always mark as success for self-verification
    setSubmissions(prev => prev.map(s => 
      s.phone === phone 
        ? { ...s, self_verified: true, payment_status: 'proof_submitted' }
        : s
    ))
    toast({
      title: "Success",
      description: "Your payment proof has been submitted successfully"
    })
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading submissions...
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
          <TabsTrigger value="self-verified">
            Self-Verified
            {submissions.filter(s => s.self_verified).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {submissions.filter(s => s.self_verified).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            WhatsApp Proofs
            {submissions.filter(s => s.payment_status === 'whatsapp_proof_submitted').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {submissions.filter(s => s.payment_status === 'whatsapp_proof_submitted').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{submission.full_name}</p>
                        <p className="text-sm text-muted-foreground">{submission.phone}</p>
                      </div>
                      {submission.payment_status === 'completed' && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {submission.self_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Self-Verified
                        </Badge>
                      )}
                    </div>

                    {!submission.self_verified && submission.payment_status !== 'completed' && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleSelfVerify(submission.phone)}
                      >
                        I've sent my proof
                      </Button>
                    )}

                    {(submission.self_verified || submission.payment_status === 'whatsapp_proof_submitted') && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleVerify(submission.phone)}
                          disabled={!!processingId}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleReject(submission.phone)}
                          disabled={!!processingId}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="self-verified">
          <div className="grid gap-4 md:grid-cols-2">
            {submissions
              .filter(s => s.self_verified)
              .map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.full_name}</p>
                          <p className="text-sm text-muted-foreground">{submission.phone}</p>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Self-Verified
                        </Badge>
                      </div>

                      <Alert>
                        <AlertDescription>
                          Participant has indicated they've sent payment proof
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleVerify(submission.phone)}
                          disabled={!!processingId}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleReject(submission.phone)}
                          disabled={!!processingId}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <div className="grid gap-4 md:grid-cols-2">
            {submissions
              .filter(s => s.payment_status === 'whatsapp_proof_submitted')
              .map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.full_name}</p>
                          <p className="text-sm text-muted-foreground">{submission.phone}</p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          WhatsApp Proof
                        </Badge>
                      </div>

                      <Alert>
                        <AlertDescription>
                          Please check WhatsApp for payment proof from this participant
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleVerify(submission.phone)}
                          disabled={!!processingId}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleReject(submission.phone)}
                          disabled={!!processingId}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}