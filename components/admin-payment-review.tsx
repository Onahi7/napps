"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, CheckCircle, XCircle, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface Payment {
  id: string
  full_name: string
  email: string
  phone: string
  payment_reference: string
  payment_proof: string
  payment_amount: number
  payment_status: string
}

export function AdminPaymentReview() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewerOpen, setViewerOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const response = await fetch('/api/admin/payments')
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

  async function handleApprove(reference: string) {
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      if (!response.ok) throw new Error('Failed to verify payment')

      toast({
        title: "Success",
        description: "Payment has been approved",
      })

      // Update the local state
      setPayments(payments.filter(p => p.payment_reference !== reference))
    } catch (error) {
      console.error('Error approving payment:', error)
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      })
    }
  }

  async function handleReject(reference: string) {
    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      if (!response.ok) throw new Error('Failed to reject payment')

      toast({
        title: "Success",
        description: "Payment has been rejected",
      })

      // Update the local state
      setPayments(payments.filter(p => p.payment_reference !== reference))
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      })
    }
  }

  const filteredPayments = payments.filter(payment => 
    payment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Reviews</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredPayments.map((payment) => (
          <Card key={payment.payment_reference}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{payment.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{payment.email}</p>
                  <p className="text-sm text-muted-foreground">Reference: {payment.payment_reference}</p>
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
                            From {selectedPayment.full_name} ({selectedPayment.payment_reference})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="aspect-[3/2] relative overflow-hidden rounded-md border">
                          <Image
                            src={selectedPayment.payment_proof}
                            alt="Payment proof"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                )}

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleApprove(payment.payment_reference)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleReject(payment.payment_reference)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center text-muted-foreground">
          No pending payment reviews
        </div>
      )}
    </div>
  )
}