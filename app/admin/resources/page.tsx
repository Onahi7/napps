"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Download, Eye, Pencil, Trash2, BarChart } from "lucide-react"
import { getResources, createResource, updateResource, deleteResource } from "@/actions/resource-actions"

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  category: string;
  is_public: boolean;
  created_at: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    isPublic: false
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const data = await getResources(true) // Include private resources for admin
      setResources(data)
    } catch (error) {
      console.error("Error fetching resources:", error)
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    try {
      await createResource({
        title: formData.title,
        type: formData.category as 'DOCUMENT' | 'VIDEO' | 'PRESENTATION' | 'OTHER',
        description: formData.description,
        file: uploadFile,
        isPublic: formData.isPublic
      })

      toast({
        title: "Success",
        description: "Resource uploaded successfully"
      })
      setIsUploadDialogOpen(false)
      resetForm()
      fetchResources()
    } catch (error) {
      console.error("Error uploading resource:", error)
      toast({
        title: "Error",
        description: "Failed to upload resource",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return

    try {
      await deleteResource(id)
      toast({
        title: "Success",
        description: "Resource deleted successfully"
      })
      fetchResources()
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (resource: Resource) => {
    setSelectedResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description || "",
      category: resource.category,
      isPublic: resource.is_public
    })
    setIsUploadDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResource) return

    try {
      await updateResource(selectedResource.id, {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic
      })

      toast({
        title: "Success",
        description: "Resource updated successfully"
      })
      setIsUploadDialogOpen(false)
      resetForm()
      fetchResources()
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      isPublic: false
    })
    setUploadFile(null)
    setSelectedResource(null)
  }

  const categories = Array.from(new Set(resources.map(r => r.category)))
  const filteredResources = resources.filter(resource => 
    (selectedCategory === "all" || resource.category === selectedCategory) &&
    (resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     resource.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Resource Management" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Resources</h2>
              <p className="text-sm text-muted-foreground">
                Manage and organize conference materials
              </p>
            </div>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{resource.title}</span>
                    <Badge variant={resource.is_public ? "default" : "secondary"}>
                      {resource.is_public ? "Public" : "Private"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{resource.category}</Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedResource ? "Edit Resource" : "Upload Resource"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={selectedResource ? handleUpdate : handleUpload}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      required={!selectedResource}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    />
                    <Label htmlFor="public">Make resource public</Label>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsUploadDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedResource ? "Update" : "Upload"}
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

