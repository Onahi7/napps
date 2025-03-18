import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Hotel Management" />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="mb-6">
            <Skeleton className="h-10 w-full max-w-md mb-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-4 w-16 mr-2" />
                    <Skeleton className="h-4 w-16 mr-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-5 w-24" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

