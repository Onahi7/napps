"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Upload, Download, Trash2, Eye, Plus, File, BarChart } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function AdminResources() {
  const [resources, setResources] = useState<Array<{
    id: number;
    name: string;
    type: string;
    size: string;
    date: string;
    access: string;
  }>>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    // TODO: Implement resource fetching from backend
    setLoading(false)
  }, [])

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement resource creation
  }

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <DashboardSidebar role="admin" />
        <div className="flex flex-col">
          <DashboardHeader role="admin" title="Resources" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p>Loading resources...</p>
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
        <DashboardHeader role="admin" title="Resources" />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Resources</h1>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="presentations">Presentations</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conference Resources</CardTitle>
                  <CardDescription>
                    Manage and organize conference materials and documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Input
                      placeholder="Search resources..."
                      className="max-w-sm mb-4"
                    />
                  </div>
                  
                  {resources.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No resources yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Add conference materials, presentations, and documents.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Size</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Date</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Access</th>
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
                              <td className="py-3 px-4">{resource.access}</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
                <DialogDescription>
                  Upload a new resource for conference participants
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddResource}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Resource Name</Label>
                    <Input id="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input id="file" type="file" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access">Access Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Participants</SelectItem>
                        <SelectItem value="paid">Paid Participants Only</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
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

