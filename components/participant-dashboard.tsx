"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, CreditCard, Hotel, FileText, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-hooks"
import { getRegistrationAmount, getConferenceDetails, type ConferenceDetails } from "@/lib/config-service"
import { getParticipantStatus } from "@/actions/profile-actions"

type PaymentStatus = "pending" | "completed" | "failed"
type AccreditationStatus = "pending" | "completed" | "declined"
type AccommodationStatus = "not_booked" | "booked" | "checked_in"

export function ParticipantDashboard() {
  const { user, profile } = useAuth()
  const [registrationAmount, setRegistrationAmount] = useState<number>(0)
  const [conferenceDetails, setConferenceDetails] = useState<ConferenceDetails>({
    name: "",
    date: "",
    venue: "",
    theme: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState({
    payment: "pending" as PaymentStatus,
    accreditation: "pending" as AccreditationStatus,
    accommodation: "not_booked" as AccommodationStatus
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [amount, details, participantStatus] = await Promise.all([
          getRegistrationAmount(),
          getConferenceDetails(),
          getParticipantStatus(user?.id)
        ])
        
        setRegistrationAmount(amount)
        setConferenceDetails(details)
        setStatus(participantStatus || {
          payment: "pending",
          accreditation: "pending",
          accommodation: "not_booked"
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const getBadgeVariant = (status: string, type: 'payment' | 'accreditation' | 'accommodation') => {
    switch (type) {
      case 'payment':
        return status === "completed" ? "outline" : "secondary"
      case 'accreditation':
        if (status === "completed") return "outline"
        if (status === "declined") return "destructive"
        return "secondary"
      case 'accommodation':
        if (status === "checked_in") return "outline"
        if (status === "booked") return "default"
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Conference Info Card */}
      <Card className="md:col-span-2 lg:col-span-3 border-napps-gold/30 card-glow">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold text-napps-gold text-shadow-sm mb-2">
            {conferenceDetails.name}
          </h2>
          <div className="flex flex-col md:flex-row gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{conferenceDetails.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{conferenceDetails.venue}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Card */}
      <Card className="border-napps-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-napps-gold" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Registration Fee:</span>
            <span className="text-xl font-bold">₦{registrationAmount.toLocaleString()}</span>
          </div>
          <Badge variant={getBadgeVariant(status.payment, 'payment')}>
            {status.payment === "completed" ? "Paid" : "Pending Payment"}
          </Badge>
        </CardContent>
        <CardFooter>
          {status.payment !== "completed" && (
            <Button asChild className="w-full" variant="gold">
              <Link href="/payment">Pay Now</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Accreditation Status Card */}
      <Card className="border-napps-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-napps-gold" />
            Accreditation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={getBadgeVariant(status.accreditation, 'accreditation')}>
            {status.accreditation === "completed"
              ? "Accredited"
              : status.accreditation === "declined"
              ? "Declined"
              : "Pending"}
          </Badge>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="gold">
            <Link href="/participant/accreditation">
              {status.accreditation === "completed" ? "View Details" : "Get Accredited"}
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Accommodation Status Card */}
      <Card className="border-napps-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-napps-gold" />
            Accommodation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={getBadgeVariant(status.accommodation, 'accommodation')}>
            {status.accommodation === "checked_in"
              ? "Checked In"
              : status.accommodation === "booked"
              ? "Booked"
              : "Not Booked"}
          </Badge>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="gold">
            <Link href="/participant/accommodation">
              {status.accommodation === "checked_in"
                ? "View Details"
                : status.accommodation === "booked"
                ? "Manage Booking"
                : "Book Now"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ParticipantDashboard;
