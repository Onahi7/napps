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
import Image from "next/image"
import { fileUtils } from "@/lib/utils"

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

  const handleProofUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)

    try {
      // Get presigned URL
      const presignedResponse = await fetch('/api/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: selectedFile.type,
        }),
      })

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { presignedUrl, fileUrl } = await presignedResponse.json()

      // Upload directly to DigitalOcean Spaces
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Update profile with new proof URL
      const updateResponse = await fetch('/api/payment-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
        }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Failed to save payment proof')
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
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof. Please try again.",
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
              {fileUtils.isPdf(proofUrl) ? (
                <iframe
                  src={proofUrl}
                  className="w-full h-full border-0"
                  title="Payment proof PDF"
                />
              ) : (
                <Image
                  src={proofUrl}
                  alt="Payment proof"
                  fill
                  className="object-contain bg-secondary"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/images/error-image.png'
                  }}
                />
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
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload Proof</span>
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