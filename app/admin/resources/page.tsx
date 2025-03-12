"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Upload, Download, Trash2, Eye, Plus, File, BarChart } from "lucide-react"
import { useState } from "react"

export default function AdminResources() {
  const [resources, setResources] = useState([
    { id: 1, name: "Conference Agenda", type: "PDF", size: "2.4 MB", date: "2025-01-15", access: "All" },
    { id: 2, name: "Keynote Presentation", type: "PPTX", size: "5.7 MB", date: "2025-01-15", access: "All" },
    { id: 3, name: "Workshop Materials", type: "ZIP", size: "12.1 MB", date: "2025-01-16", access: "All" },
    { id: 4, name: "Speaker Profiles", type: "PDF", size: "3.2 MB", date: "2025-01-16", access: "All" },
    { id: 5, name: "Venue Map", type: "PDF", size: "1.5 MB", date: "2025-01-17", access: "All" },
    { id: 6, name: "Executive Session Notes", type: "DOCX", size: "1.8 MB", date: "2025-01-17", access: "Executive" },
  ])

  const [newResource, setNewResource] = useState({
    name: "",
    type: "PDF",
    access: "All",
  })

  const handleAddResource = () => {
    const resource = {
      id: resources.length + 1,
      name: newResource.name,
      type: newResource.type,
      size: "0.0 MB",
      date: new Date().toISOString().split("T")[0],
      access: newResource.access,
    }

    setResources([...resources, resource])
    setNewResource({
      name: "",
      type: "PDF",
      access: "All",
    })
  }

  const handleDeleteResource = (id: number) => {
    setResources(resources.filter((resource) => resource.id !== id))
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Resource Management" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Conference Resources</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-napps-green hover:bg-napps-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>Upload a new resource for conference participants</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Resource Name</Label>
                    <Input
                      id="name"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      className="border-napps-green/30 focus-visible:ring-napps-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">File Type</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                    >
                      <SelectTrigger className="border-napps-green/30 focus-visible:ring-napps-green">
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCX">DOCX</SelectItem>
                        <SelectItem value="PPTX">PPTX</SelectItem>
                        <SelectItem value="ZIP">ZIP</SelectItem>
                        <SelectItem value="MP4">MP4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access">Access Level</Label>
                    <Select
                      value={newResource.access}
                      onValueChange={(value) => setNewResource({ ...newResource, access: value })}
                    >
                      <SelectTrigger className="border-napps-green/30 focus-visible:ring-napps-green">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Participants</SelectItem>
                        <SelectItem value="Executive">Executive Only</SelectItem>
                        <SelectItem value="Regular">Regular Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="border-2 border-dashed border-napps-green/30 rounded-md p-6 flex flex-col items-center justify-center">
                      <Upload className="h-10 w-10 text-napps-green/50 mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your file here or click to browse
                      </p>
                      <Button variant="outline" className="border-napps-green/30 text-napps-green">
                        Select File
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-napps-green/30">
                    Cancel
                  </Button>
                  <Button className="bg-napps-green hover:bg-napps-green/90" onClick={handleAddResource}>
                    Upload Resource
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="bg-napps-green/10 dark:bg-napps-green/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-napps-green data-[state=active]:text-white">
                All Resources
              </TabsTrigger>
              <TabsTrigger
                value="executive"
                className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
              >
                Executive Only
              </TabsTrigger>
              <TabsTrigger
                value="regular"
                className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
              >
                Regular Only
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card className="border-napps-green/20 dark:border-napps-green/30">
                <CardHeader>
                  <CardTitle>All Conference Resources</CardTitle>
                  <CardDescription>Manage all resources available to participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-napps-green/20">
                    <div className="grid grid-cols-6 border-b p-3 font-medium">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Date Added</div>
                      <div>Access Level</div>
                      <div>Actions</div>
                    </div>
                    {resources.map((resource) => (
                      <div key={resource.id} className="grid grid-cols-6 border-b p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-napps-green" />
                          <span>{resource.name}</span>
                        </div>
                        <div>{resource.type}</div>
                        <div>{resource.size}</div>
                        <div>{resource.date}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              resource.access === "Executive"
                                ? "bg-napps-gold/20 text-napps-gold dark:bg-napps-gold/30"
                                : "bg-napps-green/20 text-napps-green dark:bg-napps-green/30 dark:text-napps-gold"
                            }`}
                          >
                            {resource.access}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteResource(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="executive">
              <Card className="border-napps-green/20 dark:border-napps-green/30">
                <CardHeader>
                  <CardTitle>Executive Resources</CardTitle>
                  <CardDescription>Resources available only to executive ticket holders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-napps-green/20">
                    <div className="grid grid-cols-6 border-b p-3 font-medium">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Date Added</div>
                      <div>Access Level</div>
                      <div>Actions</div>
                    </div>
                    {resources
                      .filter((r) => r.access === "Executive")
                      .map((resource) => (
                        <div key={resource.id} className="grid grid-cols-6 border-b p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-napps-green" />
                            <span>{resource.name}</span>
                          </div>
                          <div>{resource.type}</div>
                          <div>{resource.size}</div>
                          <div>{resource.date}</div>
                          <div>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-napps-gold/20 text-napps-gold dark:bg-napps-gold/30">
                              {resource.access}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regular">
              <Card className="border-napps-green/20 dark:border-napps-green/30">
                <CardHeader>
                  <CardTitle>Regular Resources</CardTitle>
                  <CardDescription>Resources available only to regular ticket holders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-napps-green/20">
                    <div className="grid grid-cols-6 border-b p-3 font-medium">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Date Added</div>
                      <div>Access Level</div>
                      <div>Actions</div>
                    </div>
                    {resources
                      .filter((r) => r.access === "Regular")
                      .map((resource) => (
                        <div key={resource.id} className="grid grid-cols-6 border-b p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-napps-green" />
                            <span>{resource.name}</span>
                          </div>
                          <div>{resource.type}</div>
                          <div>{resource.size}</div>
                          <div>{resource.date}</div>
                          <div>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-napps-green/20 text-napps-green dark:bg-napps-green/30 dark:text-napps-gold">
                              {resource.access}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    {resources.filter((r) => r.access === "Regular").length === 0 && (
                      <div className="p-8 text-center">
                        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No resources available for regular ticket holders yet</p>
                        <Button className="mt-4 bg-napps-green hover:bg-napps-green/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Resource
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <CardTitle>Resource Analytics</CardTitle>
              <CardDescription>Track resource downloads and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                    <h3 className="font-medium mb-2">Total Downloads</h3>
                    <p className="text-3xl font-bold">487</p>
                    <p className="text-sm text-muted-foreground">+24 from yesterday</p>
                  </div>
                  <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                    <h3 className="font-medium mb-2">Most Downloaded</h3>
                    <p className="text-xl font-bold">Conference Agenda</p>
                    <p className="text-sm text-muted-foreground">156 downloads</p>
                  </div>
                  <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                    <h3 className="font-medium mb-2">Storage Used</h3>
                    <p className="text-3xl font-bold">26.7 MB</p>
                    <p className="text-sm text-muted-foreground">of 1 GB limit</p>
                  </div>
                </div>

                <div className="rounded-md border border-napps-green/20 p-4">
                  <h3 className="font-medium mb-4">Download Activity</h3>
                  <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                    <BarChart className="h-16 w-16 text-muted" />
                    <span className="ml-2 text-muted">Download activity chart will appear here</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

