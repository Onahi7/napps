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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/lib/auth-hooks"
import { CheckCircle, Clock, History, RotateCw, LayoutGrid, List } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Scan } from "@/lib/database.types"
import { getScanHistory } from "@/actions/scan-actions"
import { cn } from "@/lib/utils"

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
  location: string
}

interface ScanRecord {
  id: string
  full_name: string
  created_at: Date
  type: string
  location: string | null
}

// Add ViewToggle component
function ViewToggle({ current, onChange }: { current: "list" | "grid", onChange: (view: "list" | "grid") => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={current === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={current === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function ValidatorHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
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
        type: scan.type,
        date: new Date(scan.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: new Date(scan.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'completed',
        location: scan.location || 'Main Hall'
      }))

      setValidationHistory(records)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error",
        description: "Failed to load validation history",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id])

  // Filter validations based on search term and day
  const filteredValidations = validationHistory.filter(validation => {
    const matchesSearch = 
      validation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validation.location.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterDay === 'all') return matchesSearch
    if (filterDay === 'today') {
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      return matchesSearch && validation.date === today
    }
    return matchesSearch
  })

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader role="validator" title="Validation History">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadHistory} disabled={isRefreshing}>
              <RotateCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </DashboardHeader>
        
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Input
                placeholder="Search validations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <ViewToggle current={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValidations.map((validation) => (
                    <TableRow key={validation.id}>
                      <TableCell>{validation.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{validation.date}</span>
                          <span className="text-sm text-muted-foreground">{validation.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>{validation.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={validation.status === "completed" ? "default" : "secondary"}
                          className={validation.status === "completed" ? "bg-green-500" : ""}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {validation.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredValidations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No validations found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "Try a different search term" : "No validation records match the selected filter"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredValidations.map((validation) => (
                <Card key={validation.id} className="flex flex-col">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle>{validation.name}</CardTitle>
                      <CardDescription>{validation.location}</CardDescription>
                    </div>
                    <Badge
                      variant={validation.status === "completed" ? "default" : "secondary"}
                      className={validation.status === "completed" ? "bg-green-500" : ""}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {validation.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {validation.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {validation.time}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

