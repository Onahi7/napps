"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, CreditCard, Hotel, FileText, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-hooks"
import { getRegistrationAmount, getConferenceDetails } from "@/lib/config-service"

export function ParticipantDashboard() {
  const { user, profile } = useAuth()
  const [registrationAmount, setRegistrationAmount] = useState<number>(0)
  const [conferenceDetails, setConferenceDetails] = useState({
    name: "6th Annual NAPPS North Central Zonal Education Summit 2025",
    date: "May 21-22, 2025",
    venue: "Lafia City Hall, Lafia",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const amount = await getRegistrationAmount()
        setRegistrationAmount(amount)

        const details = await getConferenceDetails()
        if (details) {
          setConferenceDetails(details)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Sample data for dashboard
  const paymentStatus = "paid" // or "pending" or "failed"
  const accreditationStatus = "pending" // or "accredited" or "declined"
  const accommodationStatus = "not_booked" // or "booked" or "checked_in"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full border-napps-gold/30 card-glow">
        <CardHeader className="pb-2">
          <CardTitle>Welcome to the Summit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">{conferenceDetails.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{conferenceDetails.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{conferenceDetails.venue}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Thank you for registering for the summit. We look forward to seeing you!
          </p>
        </CardFooter>
      </Card>

      <Card className="border-napps-gold/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Registration</CardTitle>
            <Badge
              variant={paymentStatus === "paid" ? "default" : paymentStatus === "pending" ? "outline" : "destructive"}
              className={paymentStatus === "paid" ? "bg-green-500" : ""}
            >
              {paymentStatus === "paid"
                ? "Paid"
                : paymentStatus === "pending"
                ? "Pending"
                : "Failed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registration Fee</span>
              <span className="font-medium">₦{registrationAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Date</span>
              <span className="text-sm">March 10, 2025</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm">Card Payment</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href="/participant/payment-receipt">
                <FileText className="mr-2 h-4 w-4" />
                View Receipt
              </Link>
            </Button>
            {paymentStatus !== "paid" && (
              <Button size="sm" className="bg-napps-gold text-black hover:bg-napps-gold/90" asChild>
                <Link href="/payment">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="border-napps-gold/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Accreditation</CardTitle>
            <Badge
              variant={
                accreditationStatus === "accredited"
                  ? "default"
                  : accreditationStatus === "pending"
                  ? "outline"
                  : "destructive"
              }
              className={accreditationStatus === "accredited" ? "bg-green-500" : ""}
            >
              {accreditationStatus === "accredited"
                ? "Accredited"
                : accreditationStatus === "pending"
                ? "Pending"
                : "Declined"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {accreditationStatus === "accredited"
                ? "You have been successfully accredited for the summit."
                : accreditationStatus === "pending"
                ? "Your accreditation is pending. Please visit the accreditation desk upon arrival."
                : "Your accreditation has been declined. Please contact support."}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/participant/qrcode">
              View QR Code
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-napps-gold/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Accommodation</CardTitle>
            <Badge
              variant={
                accommodationStatus === "checked_in"
                  ? "default"
                  : accommodationStatus === "booked"
                  ? "outline"
                  : "secondary"
              }
              className={accommodationStatus === "checked_in" ? "bg-green-500" : ""}
            >
              {accommodationStatus === "checked_in"
                ? "Checked In"
                : accommodationStatus === "booked"
                ? "Booked"
                : "Not Booked"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {accommodationStatus === "checked_in"
                ? "You have checked in to your accommodation."
                : accommodationStatus === "booked"
                ? "Your accommodation has been booked."
                : "You have not booked accommodation yet."}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/participant/accommodation">
              <Hotel className="mr-2 h-4 w-4" />
              {accommodationStatus === "not_booked" ? "Book Accommodation" : "View Details"}
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-napps-gold/30">
        <CardHeader className="pb-2">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{profile?.full_name || user?.name || "Participant"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep your profile information up to date to ensure a smooth summit experience.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/participant/profile">Update Profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
