"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Users, Search, Download, Clock, User, CheckCircle, XCircle, BarChart } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"

export default function AdminAccreditation() {
  const auth = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Sample accreditation data
  const accreditationData = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "08012345678",
      school: "ABC International School",
      status: "accredited",
      timestamp: "2025-03-10T10:30:00Z",
      validatedBy: "Admin User",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "08023456789",
      school: "XYZ Primary School",
      status: "pending",
      timestamp: null,
      validatedBy: null,
    },
    {
      id: "3",
      name: "Robert Johnson",
      email: "robert@example.com",
      phone: "08034567890",
      school: "Johnson Academy",
      status: "declined",
      timestamp: "2025-03-09T14:15:00Z",
      validatedBy: "Admin User",
    },
    // Add more sample data as needed
  ]

  // Filter data based on search term and status
  const filteredData = accreditationData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      item.school.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    return matchesSearch && item.status === filterStatus
  })

  // Calculate statistics
  const totalParticipants = accreditationData.length
  const accreditedCount = accreditationData.filter((item) => item.status === "accredited").length
  const pendingCount = accreditationData.filter((item) => item.status === "pending").length
  const declinedCount = accreditationData.filter((item) => item.status === "declined").length
  const accreditedPercentage = Math.round((accreditedCount / totalParticipants) * 100)

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader 
          role="admin" 
          title="Accreditation Management"
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export CSV</span>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Registered for the summit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accredited</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accreditedCount}</div>
                <p className="text-xs text-muted-foreground">{accreditedPercentage}% of total participants</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting accreditation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Declined</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{declinedCount}</div>
                <p className="text-xs text-muted-foreground">Accreditation declined</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Accreditation Progress</CardTitle>
              <CardDescription>Overall accreditation status for the summit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-napps-gold" />
                      <span>Accreditation Status</span>
                    </div>
                    <span className="font-medium">{accreditedPercentage}%</span>
                  </div>
                  <Progress value={accreditedPercentage} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center border-b px-6 py-4">
              <CardTitle className="text-base">Participants</CardTitle>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search participants..."
                    className="w-64 rounded-lg pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Tabs defaultValue="all" className="w-auto" value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="accredited">Accredited</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50 text-sm">
                      <th className="px-6 py-3 text-left font-medium">Name</th>
                      <th className="px-6 py-3 text-left font-medium">Email/Phone</th>
                      <th className="px-6 py-3 text-left font-medium">School</th>
                      <th className="px-6 py-3 text-left font-medium">Status</th>
                      <th className="px-6 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((participant) => (
                      <tr key={participant.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>{participant.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col">
                            <span>{participant.email}</span>
                            <span className="text-xs text-muted-foreground">{participant.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{participant.school}</td>
                        <td className="px-6 py-4 text-sm">
                          <div
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              participant.status === "accredited"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : participant.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {participant.status === "accredited" ? (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            ) : participant.status === "pending" ? (
                              <Clock className="mr-1 h-3 w-3" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              disabled={participant.status === "accredited"}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Accredit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              disabled={participant.status === "declined"}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Decline</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No participants found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? "Try a different search term"
                        : "There are no participants matching the selected filter"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
