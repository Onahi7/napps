import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { AlertCircle, CheckCircle, CreditCard, FileText, School, User, Hotel, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PreRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="absolute left-4 top-4">
        <Link href="/" className="flex items-center gap-2">
          <School className="h-6 w-6 text-napps-green" />
          <span className="font-semibold text-napps-green">NAPPS Conference</span>
        </Link>
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-3xl">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Registration Instructions</h1>
          <p className="text-sm text-muted-foreground">6th Annual NAPPS North Central Zonal Education Summit 2025</p>
          <p className="text-xs text-muted-foreground">May 21-22, 2025 | Lafia City Hall, Lafia</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Before You Register</CardTitle>
            <CardDescription className="text-center">
              Please read these instructions carefully before proceeding with your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Registration requires immediate payment. Please have your payment method ready.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Registration Process</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">1. Fill Your Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide your personal information and school details
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">2. Make Payment</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete payment via Paystack (card, bank transfer, USSD)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">3. Confirmation</h4>
                    <p className="text-sm text-muted-foreground">Receive your unique participant ID and confirmation</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">4. Access Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      Login with your phone number to access your dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Things to Consider</h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-medium">Phone Number:</span> Use a valid phone number as you'll use it to login
                </li>
                <li>
                  <span className="font-medium">Payment:</span> Registration fee is non-refundable
                </li>
                <li>
                  <span className="font-medium">School Details:</span> Provide accurate information about your school
                </li>
                <li>
                  <span className="font-medium">Position in NAPPS:</span> Specify your role in the NAPPS organization
                </li>
                <li>
                  <span className="font-medium">Technical Issues:</span> If you encounter any problems during
                  registration, please contact our support team
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Accommodation Options</h3>
              <div className="flex items-start space-x-3 rounded-lg border p-4 bg-napps-green/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-napps-green/20">
                  <Hotel className="h-4 w-4 text-napps-green" />
                </div>
                <div>
                  <h4 className="font-medium">Hotel Bookings</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    After registration, you can book your accommodation through your participant dashboard.
                  </p>
                  <ul className="space-y-1 list-disc pl-5 text-sm text-muted-foreground">
                    <li>Browse partner hotels with special conference rates</li>
                    <li>Compare prices, amenities, and distance from the venue</li>
                    <li>Make reservations directly through the platform</li>
                    <li>Hotels are added by the admin and availability may change</li>
                    <li>Early booking is recommended to secure your preferred accommodation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">After Registration</h3>
              <p>
                Once you've completed registration and payment, you'll receive a confirmation with your unique
                participant ID. You can then login to your dashboard using your phone number to:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>Access your QR code for conference check-in</li>
                <li>View conference schedule and resources</li>
                <li>Book accommodation at partner hotels</li>
                <li>Track your meals during the conference</li>
                <li>Download your certificate after the conference</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Important Dates</h3>
              </div>
              <ul className="space-y-2 pl-7">
                <li className="text-sm">
                  <span className="font-medium">Conference Dates:</span> May 21-22, 2025
                </li>
                <li className="text-sm">
                  <span className="font-medium">Registration Deadline:</span> May 10, 2025
                </li>
                <li className="text-sm">
                  <span className="font-medium">Hotel Booking Deadline:</span> May 15, 2025 (subject to availability)
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild className="w-full">
              <Link href="/register">Proceed to Registration</Link>
            </Button>
            <div className="text-center text-sm">
              Already registered?{" "}
              <Link href="/login" className="underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

