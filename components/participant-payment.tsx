"use client"
import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, Copy, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useSession } from "next-auth/react"
import { uploadPaymentProof } from '@/actions/payment-actions'

interface PaymentProps {
  amount: number
  phoneNumber: string
  status: 'pending' | 'proof_submitted' | 'completed'
  proofUrl?: string | null
}

export function ParticipantPayment({ amount, phoneNumber, status, proofUrl }: PaymentProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)

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

  const handleUploadProof = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      await uploadPaymentProof({
        amount: amount || 0,
        transactionReference: phoneNumber, // Using phone number as reference
        file: file
      })
      
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully. Admin will review it shortly.",
      })
      // Refresh the page to update status
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof",
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
            <AlertDescription className="ml-2">
              Your payment has been verified and approved
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
            <AlertDescription className="ml-2">
              Your payment proof has been submitted and is under review. You will be notified once it is approved.
            </AlertDescription>
          </Alert>
          {proofUrl && (
            <div className="mt-4">
              <Label>Submitted Proof</Label>
              {proofUrl.endsWith('.pdf') ? (
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={() => window.open(proofUrl, '_blank')}
                >
                  View PDF
                </Button>
              ) : (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <img src={proofUrl} alt="Payment proof" className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>
          Please make a bank transfer of ₦{amount?.toLocaleString() ?? '0'} to the account below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Account Name</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>NAPPS UNITY BANK</span>
              <Button variant="ghost" size="sm" onClick={() => handleCopy("NAPPS UNITY BANK")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Account Number</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>0017190877</span>
              <Button variant="ghost" size="sm" onClick={() => handleCopy("0017190877")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Bank</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>Unity Bank</span>
              <Button variant="ghost" size="sm" onClick={() => handleCopy("Unity Bank")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Separator />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please include your phone number (<span className="font-medium">{phoneNumber}</span>) in the transfer narration/reference
          </AlertDescription>
        </Alert>
        <Separator />
        <Alert>
          <AlertCircle className="h-4 w-4 text-napps-gold" />
          <AlertDescription>
            After making the transfer, upload your payment proof below. Accepted formats: Images (JPG, PNG) and PDF. Maximum size: 5MB
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="w-full">
          <Input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,.pdf"
          />
          <p className="text-sm text-muted-foreground mt-2">Please ensure your proof is clear and readable</p>
        </div>
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
  )
}