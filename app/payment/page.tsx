"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Upload, AlertCircle } from "lucide-react"
import { useSession } from 'next-auth/react'
import { getConfig } from '@/lib/config-service'
import { uploadPaymentProof, initializePayment, getPaymentStatus } from "@/actions/payment-actions"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!session?.user) return;

      try {
        console.log('Getting registration amount...');
        const config = await getConfig('registrationAmount');
        const amount = config ? Number.parseFloat(config) : 10000;
        setRegistrationAmount(amount);
        console.log('Registration amount:', amount);
      } catch (error) {
        console.error('Payment initialization error:', error);
        setError('Failed to initialize payment. Please try refreshing the page.');
      } finally {
        setLoadingConfig(false);
      }
    }

    initialize();
  }, [session]);

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
    setError(null);
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload an image (JPEG, PNG) or PDF");
        toast({
          title: "Invalid file type",
          description: "Please upload an image (JPEG, PNG) or PDF",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setPaymentProofFile(file);
    }
  };

  const handleProofUpload = async () => {
    if (!paymentProofFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive"
      });
      return;
    }

    setUploadingProof(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', paymentProofFile);
      
      const result = await uploadPaymentProof(formData);
      
      if (!result?.success) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Success",
        description: "Payment proof uploaded successfully. Please wait for admin verification."
      });
      
      // Clear file input and state
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setPaymentProofFile(null);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.refresh();
        router.push("/participant/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("Error uploading proof:", error);
      setError(error.message || "Failed to upload payment proof");
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingProof(false);
    }
  };

  // Protect the route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Add loading state for reference specifically
  const isLoadingReference = status === 'loading' || loadingConfig;

  // Return early if not authenticated
  if (status === 'loading' || loadingConfig) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!session) {
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
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
            </div>

            {/* Payment Reference Instructions */}
            <Alert className="border-2 border-primary/50 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary">Important Transfer Instructions</AlertTitle>
              <AlertDescription className="mt-2">
                Please include your phone number in the transfer narration/reference when making the payment. This helps us match your payment to your registration.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Upload Payment Proof</Label>
              <Input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg,application/pdf" 
                onChange={handleFileChange}
                disabled={uploadingProof}
                className={uploadingProof ? "opacity-50 cursor-not-allowed" : ""}
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
              disabled={!paymentProofFile || uploadingProof || isLoadingReference}
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

