"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui"
import { addDays } from "date-fns"
import { DownloadCloud, Users, FileText, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getResourceStats } from "@/actions/resource-actions"

interface ResourceStats {
  total_resources: number;
  public_resources: number;
  recent_resources: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
}

export function ResourceAnalytics() {
  const [stats, setStats] = useState<ResourceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [timeframe, setTimeframe] = useState("30d")
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    try {
      const data = await getResourceStats()
      setStats(data)
    } catch (error) {
      console.error("Error fetching resource stats:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!stats) return;
    // Convert stats to CSV format
    const headers = ["Category", "Count"]
    const rows = stats.categories.map(cat => [
      cat.category,
      cat.count.toString()
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("hidden", "")
    a.setAttribute("href", url)
    a.setAttribute("download", `resource-stats-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <DownloadCloud className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_resources || 0}</div>
            <p className="text-xs text-muted-foreground">Total number of resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Resources</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.public_resources || 0}</div>
            <p className="text-xs text-muted-foreground">Publicly accessible resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Resources</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent_resources || 0}</div>
            <p className="text-xs text-muted-foreground">Added in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {stats?.categories.map((cat) => (
              <div key={cat.category} className="flex items-center">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{cat.category}</p>
                </div>
                <div className="ml-auto font-medium">
                  {cat.count} resources
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}