"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart, Calendar, CheckCircle, Clock, Coffee, QrCode, User, MapPin, Activity } from "lucide-react"
import { useAuth } from "@/lib/auth-hooks"
import { getScanStats } from "@/actions/scan-actions"
import { useToast } from "@/hooks/use-toast"
import { getAllAssignments } from "@/actions/assignment-actions"
import type { ScanType, AssignmentStatus } from '@prisma/client'

interface Assignment {
  id: string
  location: string
  date: string
  startTime: string
  endTime: string
  type: ScanType
  status: AssignmentStatus
  validatorId: string
  validatorName: string
  validatorPhone: string
}

interface ScanStats {
  today_scans: number
  recent: Array<{ participant_name: string; time: string; type: string }>
}

export default function ValidatorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scanData, setScanData] = useState<ScanStats>({
    today_scans: 0,
    recent: []
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
    if (!user?.id) return
    setIsRefreshing(true)
    try {
      const [stats, assignmentData] = await Promise.all([
        getScanStats(),
        getAllAssignments()
      ])
      
      setScanData(stats)
      setAssignments(assignmentData)

      toast({
        title: "Success",
        description: "Dashboard data refreshed",
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [user?.id])

  // Calculate progress percentages based on scan data
  const getProgressPercentage = (value: number, total: number) => {
    return (value / (total || 1)) * 100
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <DashboardSidebar role="validator" />
        <div className="flex flex-col">
          <DashboardHeader role="validator" title="Validator Dashboard">
            <Button variant="outline" size="sm" disabled className="gap-2">
              <BarChart className="h-4 w-4" />
              Loading...
            </Button>
          </DashboardHeader>
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader role="validator" title="Validator Dashboard">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="gap-2">
            <BarChart className="h-4 w-4" />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </DashboardHeader>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Validations</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.today_scans}</div>
                <p className="text-xs text-muted-foreground">+{scanData.today_scans} from today</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Accreditations</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.recent.length}</div>
                <p className="text-xs text-muted-foreground">Total accreditations performed</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Location</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Main Hall</div>
                <p className="text-xs text-muted-foreground">Current validation location</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">In Progress</div>
                <p className="text-xs text-muted-foreground">Current validation status</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>Active and upcoming accreditation duties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No assignments yet</h3>
                      <p className="text-sm text-muted-foreground">
                        You don't have any accreditation assignments at the moment
                      </p>
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex flex-col space-y-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                      >
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Accreditation Duty</span>
                            <Badge
                              variant={
                                assignment.status === "COMPLETED"
                                  ? "default"
                                  : assignment.status === "IN_PROGRESS"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={assignment.status === "COMPLETED" ? "bg-green-500" : ""}
                            >
                              {assignment.status === "COMPLETED" ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : assignment.status === "IN_PROGRESS" ? (
                                <Clock className="mr-1 h-3 w-3" />
                              ) : (
                                <Calendar className="mr-1 h-3 w-3" />
                              )}
                              {assignment.status.charAt(0) + assignment.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{assignment.location}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{assignment.date}</span>
                            <Clock className="ml-2 h-3.5 w-3.5" />
                            <span>{assignment.startTime} - {assignment.endTime}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 sm:mt-0"
                          disabled={assignment.status !== "IN_PROGRESS"}
                          asChild
                        >
                          <Link href="/validator/scan">
                            <QrCode className="mr-2 h-4 w-4" />
                            {assignment.status === "IN_PROGRESS" ? "Start Validation" : "View Details"}
                          </Link>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-full lg:col-span-3">
              <CardHeader>
                <CardTitle>Validation Overview</CardTitle>
                <CardDescription>Your validation activity and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-napps-green" />
                        <span>Total Accreditations</span>
                      </div>
                      <span className="font-medium">{scanData.recent.length}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    <p className="text-xs text-muted-foreground">Overall validation progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
