import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, CreditCard, Hotel, FileText, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-hooks"
import { getRegistrationAmount, getConferenceDetails, type ConferenceDetails } from "@/lib/config-service"

type PaymentStatus = "pending" | "completed" | "failed"
type AccreditationStatus = "pending" | "completed" | "declined"
type AccommodationStatus = "not_booked" | "booked" | "checked_in"

export function ParticipantDashboard() {
  const { user, profile } = useAuth()
  const [registrationAmount, setRegistrationAmount] = useState<number>(0)
  const [conferenceDetails, setConferenceDetails] = useState<ConferenceDetails>({
    name: "6th Annual NAPPS North Central Zonal Education Summit 2025",
    date: "May 21-22, 2025",
    venue: "Lafia City Hall, Lafia",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [accommodationStatus, setAccommodationStatus] = useState<AccommodationStatus>("not_booked")

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

  // Get current status values from profile
  const paymentStatus: PaymentStatus = profile?.payment_status as PaymentStatus || "pending"
  const accreditationStatus: AccreditationStatus = profile?.accreditation_status as AccreditationStatus || "pending"

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
          <Badge variant={getBadgeVariant(paymentStatus, 'payment')}>
            {paymentStatus === "completed" ? "Paid" : "Pending Payment"}
          </Badge>
        </CardContent>
        <CardFooter>
          {paymentStatus !== "completed" && (
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
          <Badge variant={getBadgeVariant(accreditationStatus, 'accreditation')}>
            {accreditationStatus === "completed"
              ? "Accredited"
              : accreditationStatus === "declined"
              ? "Declined"
              : "Pending"}
          </Badge>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="gold">
            <Link href="/participant/accreditation">
              {accreditationStatus === "completed" ? "View Details" : "Get Accredited"}
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
          <Badge variant={getBadgeVariant(accommodationStatus, 'accommodation')}>
            {accommodationStatus === "checked_in"
              ? "Checked In"
              : accommodationStatus === "booked"
              ? "Booked"
              : "Not Booked"}
          </Badge>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="gold">
            <Link href="/participant/accommodation">
              {accommodationStatus === "checked_in"
                ? "View Details"
                : accommodationStatus === "booked"
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
