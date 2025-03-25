import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CreditCard } from "lucide-react"
import { AdminPaymentReview } from "@/components/admin-payment-review"

export default function AdminPaymentsPage() {
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
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Loading...</div>
                <p className="text-xs text-muted-foreground">Payment proofs awaiting verification</p>
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
                {/* Payment review component will be mounted here */}
                <AdminPaymentReview />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}