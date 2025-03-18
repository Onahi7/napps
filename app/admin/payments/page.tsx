"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminPaymentReview } from "@/components/admin-payment-review"

export default function AdminPaymentsPage() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Payment Reviews" />
        <main className="flex-1 p-6">
          <AdminPaymentReview />
        </main>
      </div>
    </div>
  )
}