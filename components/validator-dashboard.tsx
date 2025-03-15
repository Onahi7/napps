"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart, Calendar, CheckCircle, Clock, Coffee, QrCode } from "lucide-react"
import { useAuth } from "@/lib/auth-hooks"
import { getScanStats } from "@/actions/scan-actions"
import { useToast } from "@/hooks/use-toast"
import { getAllAssignments } from "@/actions/assignment-actions"

interface Assignment {
  id: string
  type: 'breakfast' | 'dinner' | 'accreditation'
  status: 'pending' | 'active' | 'completed'
  location: string
  date: string
  time: string
}

interface ScanStats {
  todayScans: number
  totalScans: number
  breakfastScans: number
  dinnerScans: number
  accreditationScans: number
}

export default function ValidatorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scanData, setScanData] = useState<ScanStats>({
    todayScans: 0,
    totalScans: 0,
    breakfastScans: 0,
    dinnerScans: 0,
    accreditationScans: 0
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
      
      setScanData({
        todayScans: stats.today_scans,
        totalScans: stats.total_scans,
        breakfastScans: stats.breakfast_scans,
        dinnerScans: stats.dinner_scans,
        accreditationScans: stats.accreditation_scans
      })
      
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
  const getProgressPercentage = (type: keyof ScanStats) => {
    const value = scanData[type]
    const max = scanData.totalScans || 1 // Avoid division by zero
    return (value / max) * 100
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
                <div className="text-2xl font-bold">{scanData.todayScans}</div>
                <p className="text-xs text-muted-foreground">+{scanData.todayScans} from today</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.totalScans}</div>
                <p className="text-xs text-muted-foreground">Total validations performed</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Breakfast</CardTitle>
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
                  <path d="M7 21h10M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                  <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.breakfastScans}</div>
                <p className="text-xs text-muted-foreground">Total breakfast validations</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dinner</CardTitle>
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
                  <path d="M18 2H2v20h16"></path>
                  <path d="M7 2v20"></path>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.dinnerScans}</div>
                <p className="text-xs text-muted-foreground">Total dinner validations</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>Active and upcoming validation duties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No assignments yet</h3>
                      <p className="text-sm text-muted-foreground">
                        You don't have any validation assignments at the moment
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
                            <span className="font-medium capitalize">{assignment.type}</span>
                            <Badge
                              variant={
                                assignment.status === "completed"
                                  ? "default"
                                  : assignment.status === "active"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={assignment.status === "completed" ? "bg-green-500" : ""}
                            >
                              {assignment.status === "completed" ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : assignment.status === "active" ? (
                                <Clock className="mr-1 h-3 w-3" />
                              ) : (
                                <Calendar className="mr-1 h-3 w-3" />
                              )}
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{assignment.location}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{assignment.date}</span>
                            <Clock className="ml-2 h-3.5 w-3.5" />
                            <span>{assignment.time}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 sm:mt-0"
                          disabled={assignment.status !== "active"}
                          asChild
                        >
                          <Link href="/validator/scan">
                            <QrCode className="mr-2 h-4 w-4" />
                            {assignment.status === "active" ? "Scan Now" : "View Details"}
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
                <CardDescription>
                  Your validation activity and scan progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-napps-green" />
                        <span>Breakfast</span>
                      </div>
                      <span className="font-medium">{scanData.breakfastScans}</span>
                    </div>
                    <Progress value={getProgressPercentage('breakfastScans')} className="h-2" />
                  </div>
  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-napps-gold"
                        >
                          <path d="M16 2H2v20h16"></path>
                          <path d="M7 2v20"></path>
                          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                        </svg>
                        <span>Dinner</span>
                      </div>
                      <span className="font-medium">{scanData.dinnerScans}</span>
                    </div>
                    <Progress value={getProgressPercentage('dinnerScans')} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-green-500" />
                        <span>Accreditation</span>
                      </div>
                      <span className="font-medium">{scanData.accreditationScans}</span>
                    </div>
                    <Progress value={getProgressPercentage('accreditationScans')} className="h-2" />
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
