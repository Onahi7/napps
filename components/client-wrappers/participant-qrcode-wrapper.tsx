"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Import the component dynamically with SSR disabled
const ParticipantQRCodePage = dynamic(() => import("@/components/participant-qrcode"), {
  loading: () => (
    <div className="space-y-4 p-8">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  ),
  ssr: false,
})

export default function ParticipantQRCodeWrapper() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <ParticipantQRCodePage />
    </Suspense>
  )
}

