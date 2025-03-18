"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Copy, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [registrationAmount, setRegistrationAmount] = useState<number | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSendProof = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhone: session?.user?.phone })
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment notification');
      }

      setSuccessMessage("Successfully notified admin. Redirecting to dashboard...");
      
      setTimeout(() => {
        router.refresh();
        router.push("/participant/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("Error submitting payment notification:", error);
      setError(error.message || "Failed to submit payment notification");
    } finally {
      setSubmitting(false);
    }
  };

  // Protect the route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'unauthenticated') return null;

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
                  <span>N.A.P.P.S. Nassarawa State</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('N.A.P.P.S. Nassarawa State')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Bank</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>Unity Bank</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('Unity Bank')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Account Number</Label>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span>0017190877</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('0017190877')}>
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

            <Alert className="important-alert">
              <AlertCircle className="h-4 w-4 text-napps-gold" />
              <AlertDescription className="alert-description mt-2">
                After making the transfer, click the button below to send your payment proof via WhatsApp to {session?.user?.phone === "07011098119" ? "an alternative number" : <span className="whatsapp-bold">07011098119</span>}.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full"
              onClick={() => {
                const message = `Hello, I have made payment for NAPPS Summit registration.\n*Full Name:* ${session?.user?.full_name}\n*Phone:* ${session?.user?.phone}\n*Account Used:* Unity Bank - 0017190877`;
                window.open(`https://wa.me/2347011098119?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              Send Payment Proof on WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendProof}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "I've sent the proof on WhatsApp"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

