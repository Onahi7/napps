"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QrCode, CheckSquare, Clock, User, MapPin, Calendar, AlertCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { getAccreditationStatus, type AccreditationStatus } from "@/actions/accreditation-actions"

export default function ParticipantAccreditation() {
  const [loading, setLoading] = useState(true)
  const [accreditationStatus, setAccreditationStatus] = useState<AccreditationStatus | null>(null)

  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await getAccreditationStatus()
        setAccreditationStatus(status)
      } catch (error) {
        console.error('Error loading accreditation status:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Accreditation Status" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p>Loading accreditation status...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show payment required message if payment is not completed
  if (accreditationStatus?.status === 'pending_payment') {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Accreditation Status" />
          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Required</CardTitle>
                <CardDescription>
                  You need to complete your payment before accessing accreditation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete your registration payment to access the accreditation process
                  </AlertDescription>
                </Alert>
                <Button asChild>
                  <Link href="/participant/payment">Go to Payment</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  // Show not registered message
  if (accreditationStatus?.status === 'not_registered') {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Accreditation Status" />
          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Required</CardTitle>
                <CardDescription>
                  You need to complete your registration first
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete your registration to access the accreditation process
                  </AlertDescription>
                </Alert>
                <Button asChild>
                  <Link href="/register">Complete Registration</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Accreditation Status" />
        <main className="flex-1 p-6">
          <div className="mb-8 rounded-lg border border-napps-gold/30 bg-card p-6 shadow-sm card-glow gradient-bg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-napps-gold text-shadow-sm">Accreditation Status</h2>
                <p className="text-muted-foreground">Your conference accreditation details</p>
              </div>
              <div className="flex gap-3">
                <Button variant="gold-outline" asChild>
                  <Link href="/participant/qrcode">
                    <QrCode className="mr-2 h-4 w-4" />
                    View QR Code
                  </Link>
                </Button>
                {accreditationStatus?.status === "accredited" ? (
                  <Button variant="gold" className="shadow-gold">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Accredited
                  </Button>
                ) : (
                  <Button variant="gold" className="shadow-gold" asChild>
                    <Link href="#accreditation-info">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Get Accredited
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-napps-gold/30 card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-napps-gold" />
                  Accreditation Details
                </CardTitle>
                <CardDescription>Your conference accreditation information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-napps-gold/10 p-4 flex items-center gap-4 border border-napps-gold/20">
                  <div className="h-12 w-12 rounded-full bg-napps-gold/20 flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-napps-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-napps-gold text-shadow-sm">
                      {accreditationStatus?.status === "accredited" ? "Successfully Accredited" : "Not Accredited Yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {accreditationStatus?.status === "accredited"
                        ? `Accredited on ${accreditationStatus.accreditation_date} at ${accreditationStatus.accreditation_time}`
                        : "Please visit the accreditation desk to get accredited"}
                    </p>
                  </div>
                </div>
                {accreditationStatus?.status === "accredited" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Accreditation Time</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.accreditation_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Accreditation Date</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.accreditation_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Validated By</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.validator}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Location</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.location}</p>
                      </div>
                    </div>
                  </div>
                )}
                {accreditationStatus?.status === "pending_accreditation" && (
                  <div className="rounded-md bg-yellow-500/10 p-4 text-sm border border-yellow-500/30">
                    <p className="font-medium text-yellow-500 mb-2">Not Accredited Yet</p>
                    <p className="text-muted-foreground">
                      Please visit the accreditation desk at the Main Hall Entrance with your QR code or phone number to
                      complete your accreditation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-napps-gold/30 card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-napps-gold" />
                  Conference Materials
                </CardTitle>
                <CardDescription>Status of your conference materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">Conference Badge</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          accreditationStatus?.badge_collected
                            ? "bg-napps-gold/20 text-napps-gold border border-napps-gold/30"
                            : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        }`}
                      >
                        {accreditationStatus?.badge_collected ? "Collected" : "Not Collected"}
                      </span>
                    </div>
                    <Progress
                      value={accreditationStatus?.badge_collected ? 100 : 0}
                      className="h-2"
                      indicatorClassName="bg-napps-gold"
                    />
                    {accreditationStatus?.badge_collected && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Collected at {accreditationStatus.badge_collection_time}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">Conference Materials</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          accreditationStatus?.materials_collected
                            ? "bg-napps-gold/20 text-napps-gold border border-napps-gold/30"
                            : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        }`}
                      >
                        {accreditationStatus?.materials_collected ? "Collected" : "Not Collected"}
                      </span>
                    </div>
                    <Progress
                      value={accreditationStatus?.materials_collected ? 100 : 0}
                      className="h-2"
                      indicatorClassName="bg-napps-gold"
                    />
                    {accreditationStatus?.materials_collected && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Collected at {accreditationStatus.materials_collection_time}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Conference Materials Include:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-napps-gold" />
                      Conference Badge and Lanyard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-napps-gold" />
                      Conference Program Booklet
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-napps-gold" />
                      NAPPS Branded Notebook and Pen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-napps-gold" />
                      Welcome Package
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card id="accreditation-info" className="border-napps-gold/30 mt-6 card-glow">
            <CardHeader>
              <CardTitle>Accreditation Information</CardTitle>
              <CardDescription>Important details about the accreditation process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Accreditation Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Visit the accreditation desk at the Main Hall Entrance</li>
                    <li>Present your accreditation QR code to a validator when requested</li>
                    <li>Accreditation is required to access all conference sessions</li>
                    <li>Your accreditation status will be updated once validated</li>
                  </ol>
                </div>
                <div className="rounded-md bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Accreditation Schedule</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 1: 7:30 AM - 10:00 AM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 2: 8:00 AM - 9:00 AM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 3: 8:00 AM - 9:00 AM</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Important Notes</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Your badge must be worn visibly at all times during the conference</li>
                    <li>Lost badges can be replaced at the help desk for a fee</li>
                    <li>Accreditation is required to access all conference sessions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

