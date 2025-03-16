"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, Upload, Copy, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { initializePayment, uploadPaymentProof } from "@/actions/payment-actions"
import Image from "next/image"

interface PaymentProps {
  amount: number
  reference?: string
  status?: string
  proofUrl?: string
}

export function ParticipantPayment({ amount, reference, status, proofUrl }: PaymentProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUploadDisabled, setIsUploadDisabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({
      description: "Payment reference copied to clipboard",
    })
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
      event.target.value = '' // Clear the input
      setSelectedFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      event.target.value = '' // Clear the input
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handlePaymentInit = async () => {
    setLoading(true)
    try {
      const result = await initializePayment(amount)
      // Refresh the page to show new payment reference
      window.location.reload()
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProofUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setIsUploadDisabled(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (reference) {
        formData.append('reference', reference);
      }

      const result = await uploadPaymentProof(formData);
      
      if (!result.success) {
        throw new Error('Upload failed');
      }

      toast({
        variant: "default",
        title: "Success",
        description: "Payment proof uploaded successfully",
      });
      
      // Reset the form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the page after successful upload
      window.location.reload();

    } catch (error: any) {
      console.error('Error uploading proof:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload payment proof",
      });
    } finally {
      setUploading(false);
      setIsUploadDisabled(false);
    }
  };

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
        {!reference ? (
          <Button 
            onClick={handlePaymentInit}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initialize Payment
          </Button>
        ) : (
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
                  <Label>Payment Reference</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={reference} 
                      readOnly 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(reference || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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
                  disabled={uploading}
                  className={uploading ? "opacity-50 cursor-not-allowed" : ""}
                  ref={fileInputRef}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 5MB. Supported formats: JPEG, PNG, PDF
                </p>
              </div>

              <Button 
                onClick={handleProofUpload}
                disabled={uploading || !selectedFile || isUploadDisabled}
                className="w-full relative"
              >
                {uploading ? (
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
        )}
      </CardContent>
    </Card>
  )
}