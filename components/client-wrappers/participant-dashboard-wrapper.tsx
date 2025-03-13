"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Import the component dynamically with SSR disabled
const ParticipantDashboardPage = dynamic(() => import("@/components/participant-dashboard"), {
  loading: () => (
    <div className="space-y-4 p-8">
      <Skeleton className="h-12 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  ),
  ssr: false,
})

export default function ParticipantDashboardWrapper() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-8">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ParticipantDashboardPage />
    </Suspense>
  )
}


