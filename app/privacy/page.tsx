import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              Last updated: January 2024
            </p>

            <h2>Information We Collect</h2>
            <p>
              When you register for the NAPPS North Central Zonal Education Summit, we collect the following information:
            </p>
            <ul>
              <li>Full Name</li>
              <li>Email Address</li>
              <li>Phone Number</li>
              <li>School Information (Name, Address, Type)</li>
              <li>NAPPS Chapter Details</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>
              Your information is used for:
            </p>
            <ul>
              <li>Conference registration and verification</li>
              <li>Communication about the conference</li>
              <li>Processing payments</li>
              <li>Generating your conference credentials</li>
              <li>Event management and coordination</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. Your data is encrypted and stored securely in our database. Access to personal information is restricted to authorized personnel only.
            </p>

            <h2>Data Sharing</h2>
            <p>
              We do not share your personal information with third parties except as necessary for:
            </p>
            <ul>
              <li>Payment processing</li>
              <li>Conference organization</li>
              <li>Legal requirements</li>
            </ul>

            <h2>Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              Email: privacy@napps-summit.org<br />
              Phone: +234 xxx xxxx xxx
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}