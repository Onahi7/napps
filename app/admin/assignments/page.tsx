"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getValidators } from "@/actions/user-actions"
import { createValidatorAssignment, getAllAssignments } from "@/actions/assignment-actions"
import { cn } from "@/lib/utils"
import { Calendar, Clock, MapPin, Plus, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ScanType, AssignmentStatus } from '@prisma/client'

interface Assignment {
  id: string
  location: string
  startTime: string
  endTime: string
  type: ScanType
  status: AssignmentStatus
  validatorName: string
  validatorPhone: string
}

interface Validator {
  id: string
  fullName: string
  email: string
  phone: string
  totalScans: number
  activeAssignments: number
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [validators, setValidators] = useState<Validator[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [newAssignment, setNewAssignment] = useState({
    validatorId: "",
    location: "Main Hall",
    scheduleDate: "",
    scheduleTime: "",
  })

  const loadData = async () => {
    try {
      const [assignmentData, validatorData] = await Promise.all([
        getAllAssignments(),
        getValidators()
      ])
      setAssignments(assignmentData)
      setValidators(validatorData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateAssignment = async () => {
    try {
      await createValidatorAssignment({
        validatorId: newAssignment.validatorId,
        location: newAssignment.location,
        scheduleDate: new Date(newAssignment.scheduleDate),
        scheduleTime: newAssignment.scheduleTime,
      })

      toast({
        title: "Success",
        description: "Assignment created successfully",
      })

      // Reset form and reload data
      setNewAssignment({
        validatorId: "",
        location: "Main Hall",
        scheduleDate: "",
        scheduleTime: "",
      })
      loadData()
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <DashboardSidebar role="admin" />
        <div className="flex flex-col">
          <DashboardHeader role="admin" title="Validator Assignments" />
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Assign a validator for participant accreditation
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select Validator</Label>
                  <select
                    value={newAssignment.validatorId}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, validatorId: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="">Select a validator...</option>
                    {validators.map((validator) => (
                      <option key={validator.id} value={validator.id}>
                        {validator.fullName} ({validator.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={newAssignment.location}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newAssignment.scheduleDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, scheduleDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newAssignment.scheduleTime}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateAssignment}>Create Assignment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DashboardHeader>
        <main className="flex-1 space-y-4 p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle>{assignment.validatorName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{assignment.validatorPhone}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{assignment.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{assignment.startTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{assignment.endTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {assignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <User className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No assignments yet</h3>
              <p className="text-sm text-muted-foreground">
                Create assignments to manage validator duties
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}