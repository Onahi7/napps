"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"

export default function ParticipantAccommodation() {
  const { user, profile } = useAuth()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Accommodation" />
        <main className="flex-1 p-6">
          <div className="mb-8 rounded-lg border border-napps-gold/30 bg-card p-6 shadow-sm card-glow">
            <h2 className="text-2xl font-bold text-napps-gold text-shadow-sm mb-2">
              Conference Accommodation
            </h2>
            <p className="text-muted-foreground">
              Book your stay at our partner hotels for the duration of the conference
            </p>
          </div>

          <Tabs defaultValue="hotels" className="mb-6">
            <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 p-0.5">
              <TabsTrigger 
                value="hotels"
                className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
              >
                Available Hotels
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
              >
                My Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Partner Hotels</CardTitle>
                  <CardDescription>
                    Browse and book accommodation at our partner hotels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Hotel listings will be available closer to the conference date
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Hotel Bookings</CardTitle>
                  <CardDescription>
                    View and manage your hotel reservations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    You have no hotel bookings yet
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}