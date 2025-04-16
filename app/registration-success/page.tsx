'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react'; // Import a success icon

export default function RegistrationSuccessPage() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg shadow-lg border-green-500/30">
        <CardHeader className="items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">Registration Successful!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Welcome aboard! Your account has been created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-200 dark:border-blue-700">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">What's Next?</h4>
            <p className="text-gray-700 dark:text-gray-300">
              You can now log in using the email address you provided during registration.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              Proceed to the login page to access your participant dashboard and complete any remaining steps.
            </p>
          </div>
          
          {/* Portal Importance Section */}
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-md border border-purple-200 dark:border-purple-700">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Your Summit Hub</h4>
            <p className="text-gray-700 dark:text-gray-300">
              This portal is your central point for the summit. Use it for:
            </p>
            <ul className="list-disc list-inside text-left mt-2 text-gray-700 dark:text-gray-300 space-y-1 pl-4">
              <li>On-site validation and accreditation.</li>
              <li>Accessing summit resources and materials.</li>
              <li>Downloading your certificate after the event.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Keep your login details safe!
            </p>
          </div>

          {/* Optional: Add a reminder about checking email if verification is needed */}
          {/* 
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Check Your Email</h4>
            <p className="text-gray-700 dark:text-gray-300">
              We may have sent a verification link to your email address. Please check your inbox (and spam folder) to verify your account.
            </p>
          </div>
          */}

        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleLoginRedirect} 
            className="w-full max-w-xs bg-napps-gold text-black hover:bg-napps-gold/90 text-lg py-3"
            size="lg"
          >
            Proceed to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
