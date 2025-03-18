"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-hooks"
import { Calendar, CheckCircle, Clock, Coffee, FileDown, Search, User, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Scan } from "@/lib/database.types"
import { getScanHistory } from "@/actions/scan-actions"

interface ValidationRecord {
  id: string
  name: string
  type: string
  date: string
  time: string
  status: string
  email?: string
  phone?: string
  reason?: string
}

export default function ValidatorHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterDay, setFilterDay] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [validationHistory, setValidationHistory] = useState<ValidationRecord[]>([])

  const loadHistory = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const scans = await getScanHistory()
      
      // Transform scans into validation records
      const records = scans.map((scan): ValidationRecord => ({
        id: scan.id,
        name: scan.full_name,
        type: scan.scan_type,
        date: new Date(scan.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        time: new Date(scan.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        status: "success",
        email: scan.email,
        phone: scan.phone
      }))

      setValidationHistory(records)
    } catch (error) {
      console.error("Error loading history:", error)
      toast({
        title: "Error",
        description: "Failed to load validation history",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id])

  // Filter validations based on search term and filters
  const filteredValidations = validationHistory.filter((validation) => {
    const matchesSearch = validation.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || validation.type.toLowerCase() === filterType.toLowerCase()
    const matchesDay = filterDay === "all" || validation.date === filterDay

    return matchesSearch && matchesType && matchesDay
  })

  // Group validations by day
  const validationsByDay = filteredValidations.reduce(
    (acc, validation) => {
      if (!acc[validation.date]) {
        acc[validation.date] = []
      }
      acc[validation.date].push(validation)
      return acc
    },
    {} as Record<string, ValidationRecord[]>,
  )

  // Calculate statistics
  const totalValidations = validationHistory.length
  const successfulValidations = validationHistory.filter((v) => v.status === "success").length
  const failedValidations = validationHistory.filter((v) => v.status === "failed").length
  const breakfastValidations = validationHistory.filter((v) => v.type === "breakfast").length
  const dinnerValidations = validationHistory.filter((v) => v.type === "dinner").length

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadHistory().finally(() => {
      setIsRefreshing(false)
    })
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="validator" />
        <div className="flex flex-col">
          <DashboardHeader role="validator" title="Validation History" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Loading validation history...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader role="validator" title="Validation History">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-napps-green/30"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-napps-green/30">
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </DashboardHeader>
        <main className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalValidations}</div>
                <p className="text-xs text-muted-foreground">All validations performed</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalValidations > 0
                    ? Math.round((successfulValidations / totalValidations) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Successful validations</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
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

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 ${viewMode === "list" ? "text-napps-green" : "text-muted-foreground"}`}
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-napps-green/30"
                    onClick={() => setViewMode("grid")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 ${viewMode === "grid" ? "text-napps-green" : "text-muted-foreground"}`}
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TabsList className="bg-napps-green/10">
                    <TabsTrigger value="all" onClick={() => setFilterType("all")}>
                      All
                    </TabsTrigger>
                    <TabsTrigger value="breakfast" onClick={() => setFilterType("breakfast")}>
                      Breakfast
                    </TabsTrigger>
                    <TabsTrigger value="dinner" onClick={() => setFilterType("dinner")}>
                      Dinner
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation History */}
          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Validation History</CardTitle>
                <CardDescription>Complete history of your QR code validations</CardDescription>
              </div>
              <Button variant="outline" className="border-napps-green/30 text-napps-green hover:bg-napps-green/10">
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(validationsByDay).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No validations found</h3>
                  <p className="text-sm text-muted-foreground">
                    No validation records match your search criteria
                  </p>
                </div>
              ) : (
                <Tabs defaultValue={Object.keys(validationsByDay)[0]} className="w-full">
                  <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full justify-start mb-4">
                    {Object.keys(validationsByDay).map((day) => (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(validationsByDay).map(([day, validations]) => (
                    <TabsContent key={day} value={day}>
                      {viewMode === "list" ? (
                        <div className="rounded-md border border-napps-green/20">
                          {validations.map((validation) => (
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
                                <Badge variant={validation.type === "breakfast" ? "default" : "secondary"}>
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
                                  <Badge
                                    variant="outline"
                                    className="bg-red-500/10 text-red-500 border-red-500/30"
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {validations.map((validation) => (
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
                                    <Badge
                                      variant="outline"
                                      className="bg-red-500/10 text-red-500 border-red-500/30"
                                    >
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
                                    <Badge variant={validation.type === "breakfast" ? "default" : "secondary"}>
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
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

