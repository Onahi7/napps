"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, MapPin, Users, Calendar } from "lucide-react"
import { type ScheduleEvent, getScheduleEvents } from "@/actions/schedule-actions"

export function ParticipantSchedule() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conference Schedule</h2>
        <p className="text-sm text-muted-foreground">
          View the schedule of events for each day of the conference
        </p>
      </div>

      <Tabs defaultValue="1" value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList>
          <TabsTrigger value="1">Day 1</TabsTrigger>
          <TabsTrigger value="2">Day 2</TabsTrigger>
          <TabsTrigger value="3">Day 3</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedDay} className="space-y-4 mt-6">
          {events.filter(event => event.day.toString() === selectedDay).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Check back later for updates to the schedule.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events
                .filter(event => event.day.toString() === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="space-y-2">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
    </div>
  )
}