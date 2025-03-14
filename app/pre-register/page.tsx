"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, User, CreditCard, Check, Upload } from "lucide-react"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PreRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <h1 className="text-2xl font-semibold tracking-tight">
            6th Annual NAPPS North Central Zonal Education Summit 2025
          </h1>
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
                After registration, you will receive bank transfer details for payment. Make sure to include your payment reference code in your transfer narration.
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
                    <h4 className="font-medium">2. Make Bank Transfer</h4>
                    <p className="text-sm text-muted-foreground">
                      Transfer registration fee using the provided bank details and reference code
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">3. Upload Proof</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your payment proof (screenshot or PDF)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">4. Complete Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      Once verified, you'll receive your conference details
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
          </CardContent>
        </Card>

        <Button asChild className="w-full bg-napps-gold text-black hover:bg-napps-gold/90">
          <Link href="/register">Continue to Registration</Link>
        </Button>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

