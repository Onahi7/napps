import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QrCode, CheckSquare, Clock, User, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

export default function ParticipantAccreditation() {
  // Sample accreditation data
  const accreditationStatus = {
    status: "Accredited",
    date: "May 15, 2025",
    time: "08:45 AM",
    validator: "Michael Brown",
    location: "Main Hall Entrance",
    badge: {
      collected: true,
      collectionTime: "08:50 AM",
    },
    materials: {
      collected: true,
      collectionTime: "08:55 AM",
    },
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
                <Button variant="gold" className="shadow-gold">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {accreditationStatus.status === "Accredited" ? "Accredited" : "Get Accredited"}
                </Button>
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
                      {accreditationStatus.status === "Accredited" ? "Successfully Accredited" : "Not Accredited Yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {accreditationStatus.status === "Accredited"
                        ? `Accredited on ${accreditationStatus.date} at ${accreditationStatus.time}`
                        : "Please visit the accreditation desk to get accredited"}
                    </p>
                  </div>
                </div>

                {accreditationStatus.status === "Accredited" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Accreditation Time</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-napps-gold" />
                      <div>
                        <p className="font-medium text-white">Accreditation Date</p>
                        <p className="text-sm text-muted-foreground">{accreditationStatus.date}</p>
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

                {accreditationStatus.status !== "Accredited" && (
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
                          accreditationStatus.badge.collected
                            ? "bg-napps-gold/20 text-napps-gold border border-napps-gold/30"
                            : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        }`}
                      >
                        {accreditationStatus.badge.collected ? "Collected" : "Not Collected"}
                      </span>
                    </div>
                    <Progress
                      value={accreditationStatus.badge.collected ? 100 : 0}
                      className="h-2"
                      indicatorClassName="bg-napps-gold"
                    />
                    {accreditationStatus.badge.collected && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Collected at {accreditationStatus.badge.collectionTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">Conference Materials</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          accreditationStatus.materials.collected
                            ? "bg-napps-gold/20 text-napps-gold border border-napps-gold/30"
                            : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        }`}
                      >
                        {accreditationStatus.materials.collected ? "Collected" : "Not Collected"}
                      </span>
                    </div>
                    <Progress
                      value={accreditationStatus.materials.collected ? 100 : 0}
                      className="h-2"
                      indicatorClassName="bg-napps-gold"
                    />
                    {accreditationStatus.materials.collected && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Collected at {accreditationStatus.materials.collectionTime}
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

          <Card className="border-napps-gold/30 mt-6 card-glow">
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
                    <li>Present your QR code or provide your registered phone number</li>
                    <li>Collect your conference badge and materials</li>
                    <li>Ensure your badge is worn at all times during the conference</li>
                  </ol>
                </div>

                <div className="rounded-md bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Accreditation Schedule</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 1 (May 15): 7:30 AM - 10:00 AM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 2 (May 16): 8:00 AM - 9:00 AM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-napps-gold" />
                      <span>Day 3 (May 17): 8:00 AM - 9:00 AM</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-napps-gold/10 p-4 border border-napps-gold/20">
                  <h3 className="font-medium mb-2 text-napps-gold">Important Notes</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Your badge must be worn visibly at all times during the conference</li>
                    <li>Lost badges can be replaced at the help desk for a fee of ₦2,000</li>
                    <li>Accreditation is required to access all conference sessions and meals</li>
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

