"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, CheckCircle, Clock, AlertCircle, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface PaymentSubmission {
  id: string
  full_name: string
  email: string
  phone: string
  payment_status: string
  payment_amount: number
  created_at: string
  payment_proof?: string | null
}

export function AdminPaymentReview() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
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

      setSubmissions(prev => prev.map(s => 
        s.phone === phone 
          ? { ...s, payment_status: 'COMPLETED' }
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

      setSubmissions(prev => prev.map(s => 
        s.phone === phone 
          ? { ...s, payment_status: 'PENDING', payment_proof: null }
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
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{submission.full_name}</p>
                  <p className="text-sm text-muted-foreground">{submission.email}</p>
                </div>
              </TableCell>
              <TableCell>₦{(submission.payment_amount || 0).toLocaleString()}</TableCell>
              <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {submission.payment_status === 'COMPLETED' ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : submission.payment_status === 'PROOF_SUBMITTED' ? (
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
              </TableCell>
              <TableCell>
                {submission.payment_proof && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Proof
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogTitle>Payment Proof</DialogTitle>
                      {submission.payment_proof.endsWith('.pdf') ? (
                        <iframe 
                          src={submission.payment_proof} 
                          className="w-full h-[600px]"
                        />
                      ) : (
                        <AspectRatio ratio={16/9}>
                          <Image
                            src={submission.payment_proof}
                            alt="Payment proof"
                            fill
                            className="rounded-md object-contain"
                          />
                        </AspectRatio>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </TableCell>
              <TableCell>
                {submission.payment_status === 'PROOF_SUBMITTED' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerify(submission.phone)}
                      disabled={processingId === submission.phone}
                    >
                      {processingId === submission.phone ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(submission.phone)}
                      disabled={processingId === submission.phone}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}