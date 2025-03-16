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

interface UploadError {
  error: string
  code: string
  source: string
  details?: any
}

export function ParticipantPayment({ amount, phoneNumber, status, proofUrl }: PaymentProps) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<UploadError | null>(null)
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
    setError(null)
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      setError({
        error: 'Invalid file type. Please upload an image (JPG/PNG) or PDF',
        code: 'VALIDATION_ERROR',
        source: 'file-type-check'
      })
      event.target.value = ''
      setSelectedFile(null)
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG/PNG) or PDF",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError({
        error: 'File size too large. Maximum size is 5MB',
        code: 'VALIDATION_ERROR',
        source: 'file-size-check'
      })
      event.target.value = ''
      setSelectedFile(null)
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const getErrorMessage = (error: UploadError): string => {
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Your session has expired. Please refresh the page and try again.';
      case 'STORAGE_ERROR':
        switch (error.source) {
          case 'credentials':
            return 'Storage service is not properly configured. Please contact support.';
          case 'bucket-missing':
            return 'Storage location is not available. Please contact support.';
          default:
            return 'Failed to upload file. Please try again later.';
        }
      case 'VALIDATION_ERROR':
        return error.error;
      case 'DATABASE_ERROR':
        return 'Failed to save your payment proof. Please try again later.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  const handleProofUpload = async () => {
    if (!selectedFile || uploading) return
    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        const uploadError = data as UploadError
        setError(uploadError)
        toast({
          title: "Upload failed",
          description: getErrorMessage(uploadError),
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Payment proof uploaded successfully. Please wait for admin verification.",
      })
      
      // Reset the form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Use window.location.reload() for a full reload to ensure state is fresh
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading proof:', error)
      setError({
        error: error.message || "Failed to upload payment proof",
        code: "UNKNOWN_ERROR",
        source: "client"
      })
      toast({
        title: "Error",
        description: "Failed to upload payment proof. Please try again later.",
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
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <p><span className="font-medium">Bank:</span> Unity Bank</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p><span className="font-medium">Account Name:</span> N.A.A.PS NASARAWA STATE</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p><span className="font-medium">Account Number:</span> 0017190877</p>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy("0017190877")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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
                <p className="text-sm text-muted-foreground">
                  Please include your phone number ({phoneNumber}) in the transfer narration/reference 
                  when making the payment. This helps us match your payment to your registration.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid w-full items-center gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{getErrorMessage(error)}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
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
                className="w-full"
              >
                {(uploading || isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Proof
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}