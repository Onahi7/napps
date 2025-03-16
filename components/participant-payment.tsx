"use client"

import { useState, useRef, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Upload, Copy, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadPaymentProof } from "@/actions/payment-actions"
import Image from "next/image"

interface PaymentProps {
  amount: number
  phoneNumber: string
  status?: string
  proofUrl?: string
}

export function ParticipantPayment({ amount, phoneNumber, status, proofUrl }: PaymentProps) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG/PNG) or PDF",
        variant: "destructive",
      })
      event.target.value = ''
      setSelectedFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      event.target.value = ''
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleProofUpload = async () => {
    if (!selectedFile || uploading) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      startTransition(async () => {
        try {
          const result = await uploadPaymentProof(formData)
          
          if (!result.success) {
            throw new Error('Upload failed')
          }

          toast({
            title: "Success",
            description: "Payment proof uploaded successfully",
          })
          
          // Reset the form
          setSelectedFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

          // Use window.location.reload() instead of router.refresh() for a full reload
          window.location.reload()
        } catch (error: any) {
          console.error('Error in transition:', error)
          toast({
            title: "Error",
            description: error.message || "Failed to upload payment proof",
            variant: "destructive",
          })
        }
      })
    } catch (error: any) {
      console.error('Error uploading proof:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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
            <CheckCircle2 className="h-4 w-4" />
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
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment proof has been submitted and is pending review
            </AlertDescription>
          </Alert>

          {proofUrl && (
            <div className="aspect-[3/2] relative overflow-hidden rounded-md border">
              <Image
                src={proofUrl}
                alt="Payment proof"
                fill
                className="object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Complete your registration payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bank" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
            <TabsTrigger value="upload">Upload Proof</TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="space-y-2">
                <h3 className="font-medium">Bank Details</h3>
                <div className="text-sm">
                  <p><span className="font-medium">Bank:</span> Unity Bank</p>
                  <p><span className="font-medium">Account Name:</span> N.A.A.PS NASARAWA STATE</p>
                  <p><span className="font-medium">Account Number:</span> 0017190877</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="font-medium">Payment Amount</h3>
                <p className="text-2xl font-bold">₦{amount.toLocaleString()}</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="font-medium">Important</h3>
                <p className="text-sm text-muted-foreground">Please include your phone number ({phoneNumber}) in the transfer narration/reference when making the payment. This helps us match your payment to your registration.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="proof">Upload Payment Proof</Label>
              <Input
                id="proof"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                disabled={uploading || isPending}
                className={uploading || isPending ? "opacity-50 cursor-not-allowed" : ""}
                ref={fileInputRef}
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size: 5MB. Supported formats: JPEG, PNG, PDF
              </p>
            </div>

            <Button 
              onClick={handleProofUpload}
              disabled={uploading || isPending || !selectedFile}
              className="w-full relative"
            >
              {(uploading || isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin absolute left-4" />
                  <span className="pl-6">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Proof
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}