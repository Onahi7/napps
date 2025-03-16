"use client"

import { useState, useRef, useTransition } from 'react'
import { Loader2, Upload, CheckCircle2, Copy, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { fileUtils } from '@/lib/utils'

interface PaymentProps {
  amount: number
  phoneNumber: string
  status: 'pending' | 'proof_submitted' | 'completed'
  proofUrl?: string | null
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
      // Create form data
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Upload directly to the server
      const uploadResponse = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Failed to upload file')
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
                <img
                  src={proofUrl}
                  alt="Payment proof"
                  className="object-contain"
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
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>
          Please make a bank transfer of ₦{amount.toLocaleString()} to the account below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Account Name</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>NAPPS Summit Account</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('NAPPS Summit Account')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Bank</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>Zenith Bank</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('Zenith Bank')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Account Number</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>1234567890</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy('1234567890')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Amount</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span>₦{amount.toLocaleString()}</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(amount.toString())}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please include your phone number ({phoneNumber}) in the transfer narration/reference
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        <div>
          <Label>Upload Payment Proof</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileChange}
            disabled={uploading || isPending}
            className={uploading || isPending ? "opacity-50 cursor-not-allowed" : ""}
            ref={fileInputRef}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Maximum file size: 5MB. Supported formats: JPEG, PNG, PDF
          </p>
        </div>
      </CardContent>

      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}