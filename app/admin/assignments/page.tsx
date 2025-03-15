"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, MapPin, Pencil, Plus, Trash2, User } from "lucide-react"
import {
  createValidatorAssignment,
  deleteValidatorAssignment,
  getAllAssignments,
  updateAssignmentStatus
} from "@/actions/assignment-actions"
import { getValidators } from "@/actions/user-actions"
import { cn } from "@/lib/utils"

interface Assignment {
  id: string
  validator_id: string
  meal_type: string
  location: string
  schedule_date: Date
  schedule_time: string
  status: "pending" | "active" | "completed"
  validator_name?: string
}

interface Validator {
  id: string
  full_name: string
  email: string
}

export default function AdminAssignments() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [validators, setValidators] = useState<Validator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    validatorId: "",
    mealType: "breakfast",
    location: "",
    date: new Date(),
    time: "08:00"
  })
  
  const loadData = async () => {
    try {
      const [assignmentsData, validatorsData] = await Promise.all([
        getAllAssignments(),
        getValidators()
      ])
      setAssignments(assignmentsData)
      setValidators(validatorsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load assignments data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createValidatorAssignment({
        validatorId: formData.validatorId,
        mealType: formData.mealType,
        location: formData.location,
        scheduleDate: formData.date,
        scheduleTime: formData.time
      })
      
      toast({
        title: "Success",
        description: "Assignment created successfully",
      })
      
      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error creating assignment:", error)
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteValidatorAssignment(assignmentId)
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      })
      loadData()
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (assignmentId: string, status: string) => {
    try {
      await updateAssignmentStatus(assignmentId, status)
      toast({
        title: "Success",
        description: "Assignment status updated",
      })
      loadData()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "active":
        return "bg-blue-500"
      default:
        return "bg-yellow-500"
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <DashboardSidebar role="admin" />
        <div className="flex flex-col">
          <DashboardHeader role="admin" title="Validator Assignments">
            <Button variant="outline" size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Loading...
            </Button>
          </DashboardHeader>
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Validator Assignments">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Validator Assignment</DialogTitle>
                <DialogDescription>
                  Assign validation duties to validators
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Validator</label>
                  <Select
                    value={formData.validatorId}
                    onValueChange={(value) => setFormData({ ...formData, validatorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select validator" />
                    </SelectTrigger>
                    <SelectContent>
                      {validators.map((validator) => (
                        <SelectItem key={validator.id} value={validator.id}>
                          {validator.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.mealType}
                    onValueChange={(value) => setFormData({ ...formData, mealType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select validation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="accreditation">Accreditation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="Enter location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full">Create Assignment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </DashboardHeader>

        <main className="flex-1 p-8">
          <div className="grid gap-6">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Assignments</h3>
                  <p className="text-sm text-muted-foreground">
                    No validator assignments have been created yet
                  </p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.validator_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {assignment.meal_type}
                        </Badge>
                        <Badge className={cn("text-white", getStatusBadgeColor(assignment.status))}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {assignment.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(assignment.schedule_date), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(`2000-01-01T${assignment.schedule_time}`), "h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Select
                        value={assignment.status}
                        onValueChange={(value) => handleStatusChange(assignment.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}