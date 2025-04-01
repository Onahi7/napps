"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { getScheduleEvents, type ScheduleEvent } from "@/actions/schedule-actions"

export default function ParticipantSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState("1")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await getScheduleEvents()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => event.day.toString() === selectedDay)

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Schedule" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Schedule" />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Conference Schedule</h2>
            <p className="text-sm text-muted-foreground">
              View the complete conference schedule and plan your attendance
            </p>
          </div>

          <Tabs defaultValue="1" value={selectedDay} onValueChange={setSelectedDay}>
            <TabsList>
              <TabsTrigger value="1">Day 1</TabsTrigger>
              <TabsTrigger value="2">Day 2</TabsTrigger>
              <TabsTrigger value="3">Day 3</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedDay} className="space-y-4 mt-6">
              {filteredEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      The schedule for this day has not been published yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle>{event.title}</CardTitle>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={
                            event.type === 'SESSION' ? 'default' :
                            event.type === 'BREAK' ? 'secondary' :
                            event.type === 'REGISTRATION' ? 'outline' : 'default'
                          }>
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.venue && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.venue}
                            </div>
                          )}
                          {event.speakers && event.speakers.length > 0 && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {event.speakers.join(", ")}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

