"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Users, School, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AdminRegistrationList } from "@/components/admin-registration-list"
import { getRegistrationStats } from "@/actions/analytics-actions"

export default function AdminRegistrationsPage() {
  const [stats, setStats] = useState({
    total: 0,
    by_state: [] as { state: string; count: number }[],
    completion_rate: 0,
    payment: {
      completed: 0,
      pending: 0,
      proof_submitted: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getRegistrationStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Registration Management" />
        <main className="flex-1 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Registrations</h2>
              <p className="text-muted-foreground">Manage and track participant registrations</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export CSV</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Completed: {loading ? "--" : stats.payment.completed}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending: {loading ? "--" : (stats.payment.pending + stats.payment.proof_submitted)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : stats.by_state.reduce((sum, state) => sum + state.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">From different states</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Registration List</CardTitle>
              <CardDescription>View and manage all participant registrations</CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Input placeholder="Search by name, email, or school..." />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registrations</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <AdminRegistrationList />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}