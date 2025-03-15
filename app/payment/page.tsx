"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Upload } from "lucide-react"
import { useSession } from 'next-auth/react'
import { getConfig } from '@/lib/config-service'
import { uploadPaymentProof, initializePayment } from "@/actions/payment-actions"
import { useToast } from "@/hooks/use-toast"

const BANK_DETAILS = {
  bankName: "Unity Bank",
  accountName: "N.A.A.PS NASARAWA STATE",
  accountNumber: "0017190877"
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [registrationAmount, setRegistrationAmount] = useState<number | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getConfig('registrationAmount');
        const amount = config ? Number.parseFloat(config) : 10000;
        setRegistrationAmount(amount);
        
        // Initialize payment if no reference exists
        const ref = searchParams.get('reference');
        if (!ref) {
          const result = await initializePayment(amount);
          setPaymentReference(result.reference);
        } else {
          setPaymentReference(ref);
        }
      } catch (error) {
        console.error('Error:', error);
        setRegistrationAmount(20000);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [searchParams]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (JPEG, PNG) or PDF",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive"
        });
        return;
      }

      setPaymentProofFile(file);
    }
  };

  const handleProofUpload = async () => {
    if (!paymentProofFile || !paymentReference) return;
    setUploadingProof(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', paymentProofFile);
      formData.append('reference', paymentReference);
      
      // Upload proof directly using the server action
      await uploadPaymentProof(formData);
      
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully"
      });
      
      router.push("/participant/dashboard");
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof",
        variant: "destructive"
      });
    } finally {
      setUploadingProof(false);
    }
  };

  if (status === 'loading' || loadingConfig) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Payment Details</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer Details</CardTitle>
            <CardDescription>Please transfer the exact amount and use your reference code in the transfer narration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between">
                <span>Registration Fee:</span>
                <span className="text-xl font-bold">₦{registrationAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bank Name</Label>
                  <p className="text-lg font-medium">{BANK_DETAILS.bankName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.bankName)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Account Name</Label>
                  <p className="text-lg font-medium">{BANK_DETAILS.accountName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.accountName)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Account Number</Label>
                  <p className="text-lg font-medium">{BANK_DETAILS.accountNumber}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Your Payment Reference (add to transfer narration)</Label>
                <p className="text-lg font-medium text-primary">{paymentReference}</p>
                {paymentReference && (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentReference)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Reference
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Payment Proof</Label>
              <Input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Upload a screenshot or PDF of your payment proof (Max 5MB)
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleProofUpload} 
              disabled={!paymentProofFile || uploadingProof}
            >
              {uploadingProof ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Payment Proof
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

