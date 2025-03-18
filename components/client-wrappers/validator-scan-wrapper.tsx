"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Import the component dynamically with SSR disabled
const ValidatorScanPage = dynamic(() => import("@/components/validator-scan"), {
  loading: () => (
    <div className="space-y-4 p-8">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  ),
  ssr: false,
})

export default function ValidatorScanWrapper() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      }
    >
      <ValidatorScanPage />
    </Suspense>
  )
}

