"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Coffee,
  User,
  Calendar,
  Clock,
  BarChart4,
  FileDown,
  RefreshCw,
  List,
  Grid3X3,
} from "lucide-react"
import { useState } from "react"

export default function ValidatorHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterDay, setFilterDay] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sample validation history data
  const validationHistory = [
    { id: 1, name: "John Doe", type: "Breakfast", day: "Day 1", time: "8:15 AM", status: "success" },
    { id: 2, name: "Jane Smith", type: "Breakfast", day: "Day 1", time: "8:22 AM", status: "success" },
    { id: 3, name: "Michael Johnson", type: "Breakfast", day: "Day 1", time: "8:30 AM", status: "success" },
    {
      id: 4,
      name: "Emily Brown",
      type: "Breakfast",
      day: "Day 1",
      time: "8:45 AM",
      status: "failed",
      reason: "Already validated",
    },
    { id: 5, name: "David Wilson", type: "Dinner", day: "Day 1", time: "6:10 PM", status: "success" },
    { id: 6, name: "Sarah Davis", type: "Dinner", day: "Day 1", time: "6:25 PM", status: "success" },
    {
      id: 7,
      name: "Robert Miller",
      type: "Dinner",
      day: "Day 1",
      time: "6:40 PM",
      status: "failed",
      reason: "Invalid QR code",
    },
    { id: 8, name: "Jennifer Garcia", type: "Breakfast", day: "Day 2", time: "8:05 AM", status: "success" },
    { id: 9, name: "William Martinez", type: "Breakfast", day: "Day 2", time: "8:12 AM", status: "success" },
    { id: 10, name: "Elizabeth Robinson", type: "Breakfast", day: "Day 2", time: "8:20 AM", status: "success" },
    {
      id: 11,
      name: "James Lee",
      type: "Breakfast",
      day: "Day 2",
      time: "8:35 AM",
      status: "failed",
      reason: "Not registered",
    },
    { id: 12, name: "Patricia Walker", type: "Dinner", day: "Day 2", time: "6:05 PM", status: "success" },
    { id: 13, name: "Thomas Hall", type: "Dinner", day: "Day 2", time: "6:15 PM", status: "success" },
    { id: 14, name: "Barbara Allen", type: "Dinner", day: "Day 2", time: "6:30 PM", status: "success" },
  ]

  // Filter validations based on search term and filters
  const filteredValidations = validationHistory.filter((validation) => {
    const matchesSearch = validation.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || validation.type.toLowerCase() === filterType.toLowerCase()
    const matchesDay = filterDay === "all" || validation.day === filterDay

    return matchesSearch && matchesType && matchesDay
  })

  // Group validations by day
  const validationsByDay = filteredValidations.reduce(
    (acc, validation) => {
      if (!acc[validation.day]) {
        acc[validation.day] = []
      }
      acc[validation.day].push(validation)
      return acc
    },
    {} as Record<string, typeof validationHistory>,
  )

  // Calculate statistics
  const totalValidations = validationHistory.length
  const successfulValidations = validationHistory.filter((v) => v.status === "success").length
  const failedValidations = validationHistory.filter((v) => v.status === "failed").length
  const breakfastValidations = validationHistory.filter((v) => v.type === "Breakfast").length
  const dinnerValidations = validationHistory.filter((v) => v.type === "Dinner").length

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader role="validator" title="Validation History" />
        <main className="flex-1 p-6">
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-napps-green/20 dark:border-napps-green/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-napps-green/20 via-napps-green to-napps-green/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
                <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                  <BarChart4 className="h-4 w-4 text-napps-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalValidations}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={100} className="h-1.5" indicatorClassName="bg-napps-green" />
                  <span className="text-xs text-muted-foreground">100%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-napps-green/20 via-napps-green to-napps-green/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-napps-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successfulValidations}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress
                    value={(successfulValidations / totalValidations) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-napps-green"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((successfulValidations / totalValidations) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-napps-green/20 via-napps-green to-napps-green/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Breakfast</CardTitle>
                <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                  <Coffee className="h-4 w-4 text-napps-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakfastValidations}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress
                    value={(breakfastValidations / totalValidations) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-napps-green"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((breakfastValidations / totalValidations) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-napps-green/20 via-napps-green to-napps-green/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dinner</CardTitle>
                <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                  <Coffee className="h-4 w-4 text-napps-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dinnerValidations}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress
                    value={(dinnerValidations / totalValidations) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-napps-green"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((dinnerValidations / totalValidations) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search and Filter</CardTitle>
                  <CardDescription>Find specific validation records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-napps-green/30"
                    onClick={() => setViewMode("list")}
                  >
                    <List className={`h-4 w-4 ${viewMode === "list" ? "text-napps-green" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-napps-green/30"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3
                      className={`h-4 w-4 ${viewMode === "grid" ? "text-napps-green" : "text-muted-foreground"}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-napps-green/30"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 text-napps-green ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by participant name..."
                    className="pl-8 border-napps-green/30 focus-visible:ring-napps-green"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-[180px]">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="border-napps-green/30 focus-visible:ring-napps-green">
                        <Filter className="mr-2 h-4 w-4 text-napps-green" />
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[180px]">
                    <Select value={filterDay} onValueChange={setFilterDay}>
                      <SelectTrigger className="border-napps-green/30 focus-visible:ring-napps-green">
                        <Calendar className="mr-2 h-4 w-4 text-napps-green" />
                        <SelectValue placeholder="Filter by day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Days</SelectItem>
                        <SelectItem value="Day 1">Day 1</SelectItem>
                        <SelectItem value="Day 2">Day 2</SelectItem>
                        <SelectItem value="Day 3">Day 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Records */}
          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Validation Records</CardTitle>
                <CardDescription>Complete history of your QR code validations</CardDescription>
              </div>
              <Button variant="outline" className="border-napps-green/30 text-napps-green hover:bg-napps-green/10">
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(validationsByDay)[0] || "Day 1"} className="w-full">
                <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full justify-start mb-4">
                  {Object.keys(validationsByDay).map((day) => (
                    <TabsTrigger
                      key={day}
                      value={day}
                      className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {day}
                      <Badge variant="outline" className="ml-2 bg-background text-foreground border-napps-green/30">
                        {validationsByDay[day].length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(validationsByDay).map(([day, validations]) => (
                  <TabsContent key={day} value={day}>
                    {viewMode === "list" ? (
                      <div className="rounded-md border border-napps-green/20 overflow-hidden">
                        <div className="grid grid-cols-5 border-b border-napps-green/20 bg-napps-green/5 p-3 font-medium">
                          <div>Participant</div>
                          <div>Type</div>
                          <div>Time</div>
                          <div>Status</div>
                          <div>Details</div>
                        </div>

                        {validations.length > 0 ? (
                          validations.map((validation) => (
                            <div
                              key={validation.id}
                              className="grid grid-cols-5 border-b border-napps-green/20 p-3 last:border-0 hover:bg-napps-green/5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-napps-green" />
                                </div>
                                <span>{validation.name}</span>
                              </div>
                              <div className="flex items-center">
                                <Badge variant={validation.type === "Breakfast" ? "default" : "secondary"}>
                                  {validation.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {validation.time}
                              </div>
                              <div>
                                {validation.status === "success" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-500/10 text-green-500 border-green-500/30"
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              <div>
                                {validation.status === "failed" && (
                                  <span className="text-sm text-muted-foreground">{validation.reason}</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-muted-foreground">No validation records found</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {validations.length > 0 ? (
                          validations.map((validation) => (
                            <Card
                              key={validation.id}
                              className="border-napps-green/20 hover:border-napps-green/50 transition-colors"
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-napps-green/10 flex items-center justify-center">
                                      <User className="h-4 w-4 text-napps-green" />
                                    </div>
                                    <CardTitle className="text-base">{validation.name}</CardTitle>
                                  </div>
                                  {validation.status === "success" ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-500/10 text-green-500 border-green-500/30"
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Success
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Failed
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Type:</span>
                                    <Badge variant={validation.type === "Breakfast" ? "default" : "secondary"}>
                                      {validation.type}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Time:</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      {validation.time}
                                    </span>
                                  </div>
                                  {validation.status === "failed" && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Reason:</span>
                                      <span className="text-sm text-red-500">{validation.reason}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-3 p-8 text-center">
                            <p className="text-muted-foreground">No validation records found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

