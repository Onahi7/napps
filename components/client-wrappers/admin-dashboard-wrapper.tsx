"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Import the component dynamically with SSR disabled
const AdminDashboardPage = dynamic(() => import("@/components/admin-dashboard"), {
  loading: () => (
    <div className="w-full space-y-6 p-4 md:p-8">
      <Skeleton className="h-12 w-full md:w-3/4" />
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  ),
  ssr: false,
})

export default function AdminDashboardWrapper() {
  return (
    <div className="min-h-screen w-full">
      <Suspense
        fallback={
          <div className="w-full space-y-6 p-4 md:p-8">
            <Skeleton className="h-12 w-full md:w-3/4" />
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <AdminDashboardPage />
      </Suspense>
    </div>
  )
}

