"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CreditCard } from "lucide-react"
import { AdminPaymentReview } from "@/components/admin-payment-review"
import { getPaymentStats } from "@/actions/payment-actions"

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState({
    total_registrations: 0,
    completed_payments: 0,
    pending_proofs: 0,
    total_amount: 0,
    completion_rate: 0,
    by_state: [] as Array<{ state: string, count: number, amount: number }>
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getPaymentStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading payment stats:', error)
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
        <DashboardHeader role="admin" title="Payment Management" />
        <main className="flex-1 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Payment Reviews</h2>
              <p className="text-muted-foreground">Review and verify participant payment proofs</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export CSV</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.completed_payments}</div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Pending Review: {loading ? "--" : stats.pending_proofs}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Success Rate: {loading ? "--" : `${stats.completion_rate}%`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{loading ? "..." : stats.total_amount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">From verified payments</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Submissions</CardTitle>
              <CardDescription>Review and verify payment proofs submitted by participants</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <AdminPaymentReview />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}