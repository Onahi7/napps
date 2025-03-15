"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bankDetails, setBankDetails] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadDisabled, setIsUploadDisabled] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch bank details when bank transfer tab is selected
  const handleBankTransferSelect = useCallback(async () => {
    if (bankDetails) return // Don't fetch if we already have the details

    try {
      const response = await fetch('/api/bank-details')
      const data = await response.json()
      setBankDetails(data)
    } catch (error) {
      console.error('Error fetching bank details:', error)
      toast({
        title: "Error",
        description: "Failed to load bank account details",
        variant: "destructive",
      })
    }
  }, [bankDetails, toast])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (uploading) return // Prevent file selection while uploading
    
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG image or PDF file",
        variant: "destructive",
      })
      event.target.value = '' // Clear the input
      setSelectedFile(null)
      return
    }

    // Validate file size (5MB)
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
    } catch (error) {
      console.error('Payment initialization error:', error)
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProofUpload = async () => {
    if (!selectedFile || !reference || uploading) return;

    setUploading(true);
    setIsUploadDisabled(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('reference', reference);

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
          <Tabs defaultValue="bank" className="space-y-4" onValueChange={(value) => {
            if (value === 'bank') handleBankTransferSelect()
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
              <TabsTrigger value="upload">Upload Proof</TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Bank Name</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={bankDetails?.bankName || ''} 
                      readOnly 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(bankDetails?.bankName || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Account Number</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={bankDetails?.accountNumber || ''} 
                      readOnly 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(bankDetails?.accountNumber || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Account Name</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={bankDetails?.accountName || ''} 
                      readOnly 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(bankDetails?.accountName || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={`₦${amount.toLocaleString()}`} 
                      readOnly 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(amount.toString())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
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