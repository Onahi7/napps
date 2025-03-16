"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Upload, Copy, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { uploadPaymentProof } from "@/actions/payment-actions"

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const response = await fetch('/api/config/registration-amount');
        const data = await response.json();
        setRegistrationAmount(data.amount);
      } catch (error) {
        console.error('Error fetching registration amount:', error);
        toast({
          title: "Error",
          description: "Failed to load registration amount",
          variant: "destructive"
        });
      } finally {
        setLoadingConfig(false);
      }
    }

    initialize();
  }, [session, toast]);

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
      const result = await uploadPaymentProof(paymentProofFile);
      
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

      // Show success message with loading indicator before redirect
      setSuccessMessage("Upload successful! Redirecting to dashboard...");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.refresh();
        router.push("/participant/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("Error uploading proof:", error);
      const errorMessage = error.code === 'NETWORK_ERROR' 
        ? error.message 
        : error.message || "Failed to upload payment proof";
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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
  if (status === 'unauthenticated') return null;

  // Return loading state while checking authentication
  if (status === 'loading' || loadingConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Please make a bank transfer of ₦{registrationAmount?.toLocaleString() ?? '0'} to the account below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Account Name</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>NAPPS Summit Account</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('NAPPS Summit Account')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Bank</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>Zenith Bank</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('Zenith Bank')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Account Number</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>1234567890</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('1234567890')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Amount</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>₦{registrationAmount?.toLocaleString() ?? '0'}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(registrationAmount?.toString() ?? '0')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
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
  );
}

