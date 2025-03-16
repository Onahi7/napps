"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              Last updated: January 2024
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By registering for the NAPPS North Central Zonal Education Summit 2025, you agree to these terms and conditions.
            </p>

            <h2>2. Registration and Payment</h2>
            <ul>
              <li>Registration fee is ₦20,000 per participant</li>
              <li>Registration is only complete upon full payment of the registration fee</li>
              <li>Registration fees are non-refundable</li>
              <li>Payment must be made within 48 hours of registration</li>
              <li>You must provide accurate and complete information during registration</li>
            </ul>

            <h2>3. Conference Attendance</h2>
            <ul>
              <li>Your registration is for personal use only and is non-transferable</li>
              <li>You must wear your conference badge at all times during the event</li>
              <li>NAPPS reserves the right to refuse entry if proper identification is not provided</li>
              <li>The event will be held at Lafia City Hall, Lafia on May 21-22, 2025</li>
            </ul>

            <h2>4. Code of Conduct</h2>
            <ul>
              <li>Participants must conduct themselves professionally throughout the conference</li>
              <li>Harassment or discrimination of any kind will not be tolerated</li>
              <li>NAPPS reserves the right to remove any participant violating these terms</li>
              <li>Photography and recording may be taken during the event</li>
            </ul>

            <h2>5. Changes and Cancellations</h2>
            <ul>
              <li>NAPPS reserves the right to modify the conference program</li>
              <li>In case of event cancellation, participants will be notified and refunded</li>
              <li>Force majeure conditions may affect the execution of the conference</li>
              <li>Schedule changes will be communicated via email</li>
            </ul>

            <h2>6. Privacy and Data Protection</h2>
            <p>
              Your personal information will be handled as described in our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . This includes:
            </p>
            <ul>
              <li>Collection and storage of registration information</li>
              <li>Use of contact details for event communication</li>
              <li>Sharing of necessary information with event partners</li>
              <li>Processing of payment information</li>
            </ul>

            <h2>7. Contact Information</h2>
            <p>
              For any questions regarding these terms, please contact:<br />
              Email: info@nappsnasarawa.com<br />
              Phone: +234 803 xxx xxxx
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}