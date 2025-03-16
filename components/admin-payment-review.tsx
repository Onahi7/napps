"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, Check, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface Payment {
  id: string
  full_name: string
  email: string
  phone: string
  payment_proof: string
  payment_amount: number
  payment_status: string
}

export function AdminPaymentReview() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const response = await fetch('/api/admin/payments')
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(phone: string) {
    if (processing) return
    setProcessing(true)
    
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify payment')
      }

      toast({
        title: "Success",
        description: "Payment has been approved",
      })

      // Update the local state
      setPayments(payments.filter(p => p.phone !== phone))
      setViewerOpen(false)
    } catch (error) {
      console.error('Error approving payment:', error)
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(phone: string) {
    if (processing) return
    setProcessing(true)

    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject payment')
      }

      toast({
        title: "Success",
        description: "Payment has been rejected",
      })

      // Update the local state
      setPayments(payments.filter(p => p.phone !== phone))
      setViewerOpen(false)
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Payments</CardTitle>
          <CardDescription>
            There are no payment proofs waiting for review
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold">{payment.full_name}</h3>
                <p className="text-sm text-muted-foreground">{payment.email}</p>
                <p className="text-sm font-medium">Phone: {payment.phone}</p>
                <p className="text-sm font-medium">Amount: ₦{payment.payment_amount.toLocaleString()}</p>
              </div>

              {payment.payment_proof && (
                <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Payment Proof
                    </Button>
                  </DialogTrigger>
                  {selectedPayment && (
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Payment Proof</DialogTitle>
                        <DialogDescription>
                          From {selectedPayment.full_name} ({selectedPayment.phone})
                        </DialogDescription>
                      </DialogHeader>
                      <div className="aspect-[3/2] relative overflow-hidden rounded-md">
                        {selectedPayment.payment_proof.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={selectedPayment.payment_proof}
                            className="w-full h-full border-0"
                            title="Payment proof PDF"
                          />
                        ) : (
                          <Image
                            src={selectedPayment.payment_proof}
                            alt="Payment proof"
                            fill
                            className="object-contain bg-secondary"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/images/error-image.png'; // Add a fallback error image
                            }}
                          />
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedPayment.phone)}
                          disabled={processing}
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApprove(selectedPayment.phone)}
                          disabled={processing}
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}