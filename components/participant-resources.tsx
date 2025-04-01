"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Search, Eye } from "lucide-react"
import { getResources } from "@/actions/resource-actions"
import { trackResourceAccess } from "@/actions/resource-access-actions"
import { Badge } from "@/components/ui/badge"
import { FileIcon } from "@/components/ui/file-icon"

interface Resource {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  category: string
  created_at: string
}

export default function ParticipantResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  // Group resources by category
  const resourcesByCategory = resources.reduce((acc, resource) => {
    const category = resource.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  useEffect(() => {
    fetchResources()
  }, [])

  async function fetchResources() {
    try {
      const data = await getResources(false) // Only fetch public resources
      setResources(data)
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  const handleResourceView = async (resourceId: string) => {
    try {
      await trackResourceAccess(resourceId, 'view')
    } catch (error) {
      console.error('Error tracking resource view:', error)
    }
  }

  const handleResourceDownload = async (resourceId: string) => {
    try {
      await trackResourceAccess(resourceId, 'download')
    } catch (error) {
      console.error('Error tracking resource download:', error)
    }
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Resources" />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Conference Resources</h2>
            <p className="text-sm text-muted-foreground">
              Access conference materials, presentations, and documents
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {resources.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources available yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Conference materials and documents will be made available here once uploaded by the organizers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Resources</TabsTrigger>
                {Object.keys(resourcesByCategory).map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <Card key={resource.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileIcon className="mr-2 h-4 w-4" />
                            <span className="capitalize">{resource.file_type}</span>
                          </div>
                          <Badge variant="secondary">
                            {resource.category}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await handleResourceView(resource.id)
                            window.open(resource.file_url, '_blank')
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await handleResourceDownload(resource.id)
                            const a = document.createElement('a')
                            a.href = resource.file_url
                            a.download = resource.title
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryResources
                      .filter(resource =>
                        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((resource) => (
                        <Card key={resource.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="truncate">{resource.title}</span>
                            </CardTitle>
                            <CardDescription>
                              {resource.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">
                                {new Date(resource.created_at).toLocaleDateString()}
                              </div>
                              <div className="space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={resource.file_url} download>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>
    </div>
  )
}