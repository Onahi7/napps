"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { getConferenceDetails, type ConferenceDetailsResponse } from "@/lib/config-service"

interface ScheduleEvent {
  id: number;
  time: string;
  title: string;
  location: string;
  speaker: string;
  description: string;
}

interface DaySchedule {
  [key: string]: ScheduleEvent[];
}

export default function ParticipantSchedule() {
  const [schedule, setSchedule] = useState<DaySchedule>({})
  const [loading, setLoading] = useState(true)
  const [conferenceDetails, setConferenceDetails] = useState<ConferenceDetailsResponse>({
    name: "",
    date: "",
    venue: "",
    venue_address: "",
    theme: "",
    registration_hours: "",
    morning_hours: "",
    afternoon_hours: "",
    evening_hours: ""
  })
  
  const days = ["Day 1", "Day 2"]
  
  useEffect(() => {
    async function loadSchedule() {
      try {
        const details = await getConferenceDetails()
        setConferenceDetails(details)
        // TODO: Implement schedule fetching from API
        setLoading(false)
      } catch (error) {
        console.error('Error loading schedule:', error)
        setLoading(false)
      }
    }
    loadSchedule()
  }, [])

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Conference Schedule" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p>Loading schedule...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Conference Schedule" />
        <main className="flex-1 p-6">
          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <CardTitle>Conference Schedule</CardTitle>
              <CardDescription>View the complete schedule for all conference days</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(schedule).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Schedule not available yet</h3>
                  <p className="text-sm text-muted-foreground">
                    The conference schedule will be published here once finalized.
                  </p>
                </div>
              ) : (
                <Tabs defaultValue={days[0]} className="w-full">
                  <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full justify-start mb-4">
                    {days.map((day) => (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                      >
                        {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {days.map((day) => (
                    <TabsContent key={day} value={day}>
                      <div className="space-y-8">
                        {schedule[day]?.map((event) => (
                          <div
                            key={event.id}
                            className="flex flex-col space-y-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
                          >
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{event.title}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                              {event.speaker && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>{event.speaker}</span>
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-napps-green" />
                  Conference Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration:</span>
                    <span>{conferenceDetails.registration_hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Morning Sessions:</span>
                    <span>{conferenceDetails.morning_hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Afternoon Sessions:</span>
                    <span>{conferenceDetails.afternoon_hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evening Sessions:</span>
                    <span>{conferenceDetails.evening_hours}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-napps-green" />
                  Venue Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Main Conference Venue</h3>
                    <p className="text-muted-foreground">{conferenceDetails.venue}</p>
                    <p className="text-muted-foreground">{conferenceDetails.venue_address}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-napps-green/30 text-napps-green hover:bg-napps-green/10"
                  >
                    View Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

