"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, Eye, BookOpen, Video, File } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

type Resource = {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  category: string;
}

export default function ParticipantResources() {
  const { data: session } = useSession()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadResources() {
      try {
        // TODO: Implement resource fetching from backend
        setLoading(false)
      } catch (error) {
        console.error('Error loading resources:', error)
        setLoading(false)
      }
    }

    if (session) {
      loadResources()
    }
  }, [session])

  if (!session) {
    return <p className="text-red-500">You must be logged in to view this page</p>
  }

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Resources" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p>Loading resources...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const resourcesByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = []
    }
    acc[resource.category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Resources" />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Conference Materials</CardTitle>
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

              {resources.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No resources available yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Conference materials will be made available here once uploaded.
                  </p>
                </div>
              ) : (
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
                    <div className="rounded-md border">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Size</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Date Added</th>
                            <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resources.map((resource) => (
                            <tr key={resource.id} className="border-b">
                              <td className="py-3 px-4">{resource.name}</td>
                              <td className="py-3 px-4">{resource.type}</td>
                              <td className="py-3 px-4">{resource.size}</td>
                              <td className="py-3 px-4">{resource.date}</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
                    <TabsContent key={category} value={category}>
                      <div className="rounded-md border">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                              <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                              <th className="py-3 px-4 text-left text-sm font-medium">Size</th>
                              <th className="py-3 px-4 text-left text-sm font-medium">Date Added</th>
                              <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryResources.map((resource) => (
                              <tr key={resource.id} className="border-b">
                                <td className="py-3 px-4">{resource.name}</td>
                                <td className="py-3 px-4">{resource.type}</td>
                                <td className="py-3 px-4">{resource.size}</td>
                                <td className="py-3 px-4">{resource.date}</td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}