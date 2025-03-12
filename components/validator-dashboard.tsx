"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { QrCode, Calendar, Clock, CheckCircle, XCircle, ArrowRight, BarChart, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-hooks"
import { getScansByValidator, getValidatorAssignments } from "@/actions/scan-actions"

export default function ValidatorDashboard() {
  const { user, profile } = useAuth()
  const [scanData, setScanData] = useState({
    todayScans: 0,
    totalScans: 0,
    breakfastScans: 0,
    dinnerScans: 0,
    lunchScans: 0,
    accreditationScans: 0,
  })
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        // In a real app, these would fetch data from your API
        // For this mock, we'll use dummy data
        
        // Mock scan data
        setScanData({
          todayScans: 42,
          totalScans: 156,
          breakfastScans: 18,
          lunchScans: 15,
          dinnerScans: 9,
          accreditationScans: 0,
        })

        // Mock assignments
        setAssignments([
          {
            id: 1,
            type: "breakfast",
            location: "Main Hall",
            date: "2025-05-21",
            time: "07:00 - 09:00",
            status: "completed",
          },
          {
            id: 2,
            type: "lunch",
            location: "Dining Area",
            date: "2025-05-21",
            time: "12:30 - 14:30",
            status: "completed",
          },
          {
            id: 3,
            type: "dinner",
            location: "Dining Area",
            date: "2025-05-21",
            time: "18:30 - 20:30",
            status: "active",
          },
          {
            id: 4,
            type: "breakfast",
            location: "Main Hall",
            date: "2025-05-22",
            time: "07:00 - 09:00",
            status: "upcoming",
          },
        ])
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const refreshData = () => {
    // In a real app, this would refresh the data from your API
    // For this mock, we'll just simulate a refresh
    setIsLoading(true)
    setTimeout(() => {
      setScanData((prev) => ({
        ...prev,
        todayScans: prev.todayScans + 3,
        totalScans: prev.totalScans + 3,
        dinnerScans: prev.dinnerScans + 3,
      }))
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader heading="Validator Dashboard" text="Monitor your validation activities">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Refresh</span>
            </Button>
          </div>
        </DashboardHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Scans</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.todayScans}</div>
                <p className="text-xs text-muted-foreground">Validations performed today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.totalScans}</div>
                <p className="text-xs text-muted-foreground">All-time validations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Breakfast</CardTitle>
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
                  className="text-muted-foreground"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.breakfastScans}</div>
                <p className="text-xs text-muted-foreground">Breakfast validations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dinner</CardTitle>
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
                  className="text-muted-foreground"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                  <path d="M7 2v20"></path>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.dinnerScans}</div>
                <p className="text-xs text-muted-foreground">Dinner validations</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>Validation duties assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
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
                  ))}

                  {assignments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No assignments yet</h3>
                      <p className="text-sm text-muted-foreground">
                        You don't have any validation assignments at the moment
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/validator/assignments">
                    View All Assignments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="col-span-full lg:col-span-3">
              <CardHeader>
                <CardTitle>Validation Progress</CardTitle>
                <CardDescription>Your validation activity breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        className="text-blue-500"
                      >
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                        <line x1="6" y1="1" x2="6" y2="4"></line>
                        <line x1="10" y1="1" x2="10" y2="4"></line>
                        <line x1="14" y1="1" x2="14" y2="4"></line>
                      </svg>
                      <span>Breakfast</span>
                    </div>
                    <span className="font-medium">{scanData.breakfastScans}</span>
                  </div>
                  <Progress value={42} className="h-2" />
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
                        className="text-green-500"
                      >
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                        <path d="M7 2v20"></path>
                        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                      </svg>
                      <span>Lunch</span>
                    </div>
                    <span className="font-medium">{scanData.lunchScans}</span>
                  </div>
                  <Progress value={35} className="h-2" />
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
                        className="text-purple-500"
                      >
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                        <path d="M7 2v20"></path>
                        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                      </svg>
                      <span>Dinner</span>
                    </div>
                    <span className="font-medium">{scanData.dinnerScans}</span>
                  </div>
                  <Progress value={21} className="h-2" />
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
                        className="text-yellow-500"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>Accreditation</span>
                    </div>
                    <span className="font-medium">{scanData.accreditationScans}</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
