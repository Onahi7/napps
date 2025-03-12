"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, Eye, BookOpen, Video, File } from "lucide-react"
import { useAuth } from "@/components/supabase-auth-provider"

export default function ParticipantResources() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return null // You could add a loading skeleton here if needed
  }

  const resources = [
    { id: 1, name: "Conference Agenda", type: "PDF", size: "2.4 MB", date: "2025-01-15", category: "Documents" },
    {
      id: 2,
      name: "Keynote Presentation",
      type: "PPTX",
      size: "5.7 MB",
      date: "2025-01-15",
      category: "Presentations",
    },
    { id: 3, name: "Workshop Materials", type: "ZIP", size: "12.1 MB", date: "2025-01-16", category: "Documents" },
    { id: 4, name: "Speaker Profiles", type: "PDF", size: "3.2 MB", date: "2025-01-16", category: "Documents" },
    { id: 5, name: "Venue Map", type: "PDF", size: "1.5 MB", date: "2025-01-17", category: "Documents" },
    { id: 6, name: "Opening Ceremony Video", type: "MP4", size: "45.8 MB", date: "2025-01-15", category: "Videos" },
    { id: 7, name: "Keynote Speech Recording", type: "MP4", size: "78.3 MB", date: "2025-01-15", category: "Videos" },
    {
      id: 8,
      name: "Workshop Slides - Technology in Education",
      type: "PPTX",
      size: "8.2 MB",
      date: "2025-01-16",
      category: "Presentations",
    },
    { id: 9, name: "Panel Discussion Notes", type: "PDF", size: "1.8 MB", date: "2025-01-16", category: "Documents" },
    { id: 10, name: "Certificate Template", type: "PDF", size: "0.9 MB", date: "2025-01-17", category: "Documents" },
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />
      case "PPTX":
        return <FileText className="h-5 w-5 text-orange-500" />
      case "ZIP":
        return <File className="h-5 w-5 text-purple-500" />
      case "MP4":
        return <Video className="h-5 w-5 text-blue-500" />
      default:
        return <File className="h-5 w-5 text-napps-green" />
    }
  }

  // Group resources by category
  const resourcesByCategory = resources.reduce(
    (acc, resource) => {
      if (!acc[resource.category]) {
        acc[resource.category] = []
      }
      acc[resource.category].push(resource)
      return acc
    },
    {} as Record<string, typeof resources>,
  )

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Conference Resources" />
        <main className="flex-1 p-6">
          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <CardTitle>Available Resources</CardTitle>
              <CardDescription>Access all conference materials and presentations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  className="pl-8 border-napps-green/30 focus-visible:ring-napps-green"
                />
              </div>
              <Tabs defaultValue="All" className="w-full">
                <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full justify-start mb-4">
                  <TabsTrigger
                    value="All"
                    className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                  >
                    All Resources
                  </TabsTrigger>
                  {Object.keys(resourcesByCategory).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="All">
                  <div className="rounded-md border border-napps-green/20">
                    <div className="grid grid-cols-5 border-b p-3 font-medium">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Date Added</div>
                      <div>Actions</div>
                    </div>
                    {resources.map((resource) => (
                      <div key={resource.id} className="grid grid-cols-5 border-b p-3 last:border-0">
                        <div className="flex items-center gap-2">
                          {getFileIcon(resource.type)}
                          <span>{resource.name}</span>
                        </div>
                        <div>{resource.type}</div>
                        <div>{resource.size}</div>
                        <div>{resource.date}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
                  <TabsContent key={category} value={category}>
                    <div className="rounded-md border border-napps-green/20">
                      <div className="grid grid-cols-5 border-b p-3 font-medium">
                        <div>Name</div>
                        <div>Type</div>
                        <div>Size</div>
                        <div>Date Added</div>
                        <div>Actions</div>
                      </div>
                      {categoryResources.map((resource) => (
                        <div key={resource.id} className="grid grid-cols-5 border-b p-3 last:border-0">
                          <div className="flex items-center gap-2">
                            {getFileIcon(resource.type)}
                            <span>{resource.name}</span>
                          </div>
                          <div>{resource.type}</div>
                          <div>{resource.size}</div>
                          <div>{resource.date}</div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-napps-green" />
                  Featured Resources
                </CardTitle>
                <CardDescription>Recommended materials for all participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.slice(0, 3).map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between rounded-lg border border-napps-green/20 p-3 hover:bg-napps-green/5"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(resource.type)}
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {resource.type} • {resource.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-napps-green" />
                  Recent Videos
                </CardTitle>
                <CardDescription>Watch recordings of conference sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources
                    .filter((r) => r.type === "MP4")
                    .map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-lg border border-napps-green/20 p-3 hover:bg-napps-green/5"
                      >
                        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">{resource.name}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{resource.size}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-napps-green/30 text-napps-green hover:bg-napps-green/10"
                          >
                            Watch Now
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}