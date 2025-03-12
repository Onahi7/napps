import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, User } from "lucide-react"

export default function ParticipantSchedule() {
  const days = ["Day 1 - May 15", "Day 2 - May 16", "Day 3 - May 17"]

  const scheduleData = {
    "Day 1 - May 15": [
      {
        id: 1,
        time: "08:00 - 09:00",
        title: "Registration & Breakfast",
        location: "Main Hall Entrance",
        speaker: "",
        description: "Pick up your conference materials and enjoy breakfast",
      },
      {
        id: 2,
        time: "09:00 - 10:00",
        title: "Opening Ceremony",
        location: "Main Hall",
        speaker: "NAPPS President",
        description: "Welcome address and opening remarks",
      },
      {
        id: 3,
        time: "10:30 - 12:00",
        title: "Keynote Speech: The Future of Education in Nigeria",
        location: "Main Hall",
        speaker: "Dr. Samuel Adeyemi",
        description: "An insightful talk on emerging trends in education",
      },
      {
        id: 4,
        time: "12:00 - 13:00",
        title: "Lunch Break",
        location: "Dining Area",
        speaker: "",
        description: "Networking lunch",
      },
      {
        id: 5,
        time: "13:00 - 15:00",
        title: "Workshop: Implementing Technology in Classrooms",
        location: "Room 101",
        speaker: "Prof. Elizabeth Johnson",
        description: "Practical session on integrating technology in teaching",
      },
      {
        id: 6,
        time: "15:30 - 17:00",
        title: "Panel Discussion: Challenges in Private Education",
        location: "Main Hall",
        speaker: "Various Speakers",
        description: "Industry experts discuss current challenges",
      },
      {
        id: 7,
        time: "18:00 - 20:00",
        title: "Welcome Dinner",
        location: "Grand Ballroom",
        speaker: "",
        description: "Networking dinner with entertainment",
      },
    ],
    "Day 2 - May 16": [
      {
        id: 8,
        time: "08:00 - 09:00",
        title: "Breakfast",
        location: "Dining Area",
        speaker: "",
        description: "Morning refreshments",
      },
      {
        id: 9,
        time: "09:00 - 10:30",
        title: "Workshop: Financial Management for Schools",
        location: "Room 102",
        speaker: "Mr. James Wilson",
        description: "Strategies for effective financial management",
      },
      {
        id: 10,
        time: "11:00 - 12:30",
        title: "Presentation: Curriculum Development",
        location: "Main Hall",
        speaker: "Dr. Grace Okafor",
        description: "Modern approaches to curriculum design",
      },
      {
        id: 11,
        time: "12:30 - 13:30",
        title: "Lunch Break",
        location: "Dining Area",
        speaker: "",
        description: "Networking lunch",
      },
      {
        id: 12,
        time: "13:30 - 15:00",
        title: "Workshop: Student Assessment Techniques",
        location: "Room 103",
        speaker: "Mrs. Patricia Nwosu",
        description: "Innovative methods for student assessment",
      },
      {
        id: 13,
        time: "15:30 - 17:00",
        title: "Roundtable: School Leadership",
        location: "Conference Room A",
        speaker: "Various Speakers",
        description: "Discussion on effective school leadership",
      },
      {
        id: 14,
        time: "18:00 - 20:00",
        title: "Dinner",
        location: "Grand Ballroom",
        speaker: "",
        description: "Evening dinner and networking",
      },
    ],
    "Day 3 - May 17": [
      {
        id: 15,
        time: "08:00 - 09:00",
        title: "Breakfast",
        location: "Dining Area",
        speaker: "",
        description: "Morning refreshments",
      },
      {
        id: 16,
        time: "09:00 - 10:30",
        title: "Workshop: Marketing Your School",
        location: "Room 104",
        speaker: "Mr. David Okon",
        description: "Effective strategies for school marketing and branding",
      },
      {
        id: 17,
        time: "11:00 - 12:30",
        title: "Keynote: Education Policy Updates",
        location: "Main Hall",
        speaker: "Ministry of Education Representative",
        description: "Latest updates on education policies and regulations",
      },
      {
        id: 18,
        time: "12:30 - 13:30",
        title: "Lunch Break",
        location: "Dining Area",
        speaker: "",
        description: "Final networking lunch",
      },
      {
        id: 19,
        time: "13:30 - 15:00",
        title: "Panel: Future of Private Schools in Nigeria",
        location: "Main Hall",
        speaker: "Industry Leaders",
        description: "Discussion on trends and future outlook",
      },
      {
        id: 20,
        time: "15:30 - 16:30",
        title: "Closing Ceremony",
        location: "Main Hall",
        speaker: "NAPPS Executive Committee",
        description: "Closing remarks and certificate distribution",
      },
    ],
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Conference Schedule" />
        <main className="flex-1 p-6">
          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <CardTitle>NAPPS Conference 2025 Schedule</CardTitle>
              <CardDescription>View the complete schedule for all conference days</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <TabsContent key={day} value={day} className="space-y-4">
                    <div className="rounded-md border border-napps-green/20 dark:border-napps-green/30 divide-y">
                      {scheduleData[day as keyof typeof scheduleData].map((event) => (
                        <div key={event.id} className="p-4 hover:bg-napps-green/5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-napps-green" />
                              <span className="font-medium">{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-napps-green" />
                              <span>{event.location}</span>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold mb-1">{event.title}</h3>

                          {event.speaker && (
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-napps-green" />
                              <span className="text-sm">{event.speaker}</span>
                            </div>
                          )}

                          <p className="text-muted-foreground">{event.description}</p>

                          {event.id % 3 === 1 && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-napps-green/30 text-napps-green hover:bg-napps-green/10"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Add to Calendar
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <span>8:00 AM - 9:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Morning Sessions:</span>
                    <span>9:00 AM - 12:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lunch Break:</span>
                    <span>12:30 PM - 1:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Afternoon Sessions:</span>
                    <span>1:30 PM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evening Events:</span>
                    <span>6:00 PM - 8:00 PM</span>
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
                    <p className="text-muted-foreground">NAPPS Conference Center</p>
                    <p className="text-muted-foreground">123 Education Avenue, Abuja</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Accommodation</h3>
                    <p className="text-muted-foreground">Green Suites Hotel</p>
                    <p className="text-muted-foreground">Adjacent to Conference Center</p>
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

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-napps-green" />
                  My Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-3">
                    <div className="text-sm text-muted-foreground mb-1">Day 1 - May 15</div>
                    <div className="font-medium">Opening Ceremony</div>
                    <div className="text-sm">9:00 AM - 10:00 AM</div>
                  </div>
                  <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-3">
                    <div className="text-sm text-muted-foreground mb-1">Day 2 - May 16</div>
                    <div className="font-medium">Workshop: Financial Management</div>
                    <div className="text-sm">9:00 AM - 10:30 AM</div>
                  </div>
                  <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-3">
                    <div className="text-sm text-muted-foreground mb-1">Day 3 - May 17</div>
                    <div className="font-medium">Closing Ceremony</div>
                    <div className="text-sm">3:30 PM - 4:30 PM</div>
                  </div>
                  <Button className="w-full bg-napps-green hover:bg-napps-green/90">Customize My Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

