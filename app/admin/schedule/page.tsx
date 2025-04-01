"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Clock,
  MapPin,
  Users,
  Calendar,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react"
import {
  getEvents as getScheduleEvents,
  createEvent as createScheduleEvent,
  updateEvent as updateScheduleEvent,
  deleteEvent as deleteScheduleEvent,
  type ScheduleEvent
} from "@/actions/schedule-actions"

export default function AdminSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState("1")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    day: 1,
    venue: "",
    speakers: "",
    type: "session"
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await getScheduleEvents()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load schedule events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const speakersArray = formData.speakers
        ? formData.speakers.split(",").map(s => s.trim())
        : []

      await createScheduleEvent({
        title: formData.title,
        description: formData.description,
        startTime: formData.start_time,
        endTime: formData.end_time,
        day: formData.day,
        venue: formData.venue,
        speakers: speakersArray,
        type: formData.type.toUpperCase() as "SESSION" | "BREAK" | "REGISTRATION" | "SPECIAL"
      })

      toast({
        title: "Success",
        description: "Event added successfully"
      })
      setIsAddDialogOpen(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return

    setIsSubmitting(true)
    try {
      const speakersArray = formData.speakers
        ? formData.speakers.split(",").map(s => s.trim())
        : []

      await updateScheduleEvent(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        startTime: formData.start_time,
        endTime: formData.end_time,
        day: formData.day,
        venue: formData.venue,
        speakers: speakersArray,
        type: formData.type.toUpperCase() as "SESSION" | "BREAK" | "REGISTRATION" | "SPECIAL"
      })

      toast({
        title: "Success",
        description: "Event updated successfully"
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteScheduleEvent(id)
      toast({
        title: "Success",
        description: "Event deleted successfully"
      })
      fetchEvents()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      day: 1,
      venue: "",
      speakers: "",
      type: "session"
    })
    setSelectedEvent(null)
  }

  const openEditDialog = (event: ScheduleEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      start_time: event.startTime,
      end_time: event.endTime,
      day: event.day,
      venue: event.venue || "",
      speakers: event.speakers ? event.speakers.join(", ") : "",
      type: event.type.toLowerCase()
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <DashboardSidebar role="admin" />
        <div className="flex flex-col">
          <DashboardHeader role="admin" title="Schedule" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Schedule" />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Conference Schedule</h1>
              <p className="text-sm text-muted-foreground">
                Manage and organize conference events
              </p>
            </div>
            <Button onClick={() => {
              resetForm()
              setIsAddDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
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
                      Add events to create a schedule for this day.
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
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
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
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Add Event Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Event</DialogTitle>
                <DialogDescription>
                  Add a new event to the conference schedule
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEvent}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select
                        value={formData.day.toString()}
                        onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Day 1</SelectItem>
                          <SelectItem value="2">Day 2</SelectItem>
                          <SelectItem value="3">Day 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Event Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="session">Session</SelectItem>
                          <SelectItem value="break">Break</SelectItem>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speakers">Speakers (comma-separated)</Label>
                    <Input
                      id="speakers"
                      value={formData.speakers}
                      onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
                      placeholder="John Doe, Jane Smith"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Event"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update the event details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditEvent}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start_time">Start Time</Label>
                      <Input
                        id="edit-start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end_time">End Time</Label>
                      <Input
                        id="edit-end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-day">Day</Label>
                      <Select
                        value={formData.day.toString()}
                        onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Day 1</SelectItem>
                          <SelectItem value="2">Day 2</SelectItem>
                          <SelectItem value="3">Day 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Event Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="session">Session</SelectItem>
                          <SelectItem value="break">Break</SelectItem>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-venue">Venue</Label>
                    <Input
                      id="edit-venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-speakers">Speakers (comma-separated)</Label>
                    <Input
                      id="edit-speakers"
                      value={formData.speakers}
                      onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
                      placeholder="John Doe, Jane Smith"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Event"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}