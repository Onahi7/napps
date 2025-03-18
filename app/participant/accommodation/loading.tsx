import { CardFooter } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Accommodation" />
        <main className="flex-1 p-6">
          <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm relative overflow-hidden">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>

          <Tabs defaultValue="hotels" className="mb-6">
            <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 p-0.5">
              <TabsTrigger value="hotels" className="data-[state=active]:bg-napps-green data-[state=active]:text-white">
                Available Hotels
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
              >
                My Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-48" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-64" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[100px]" />
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index}>
                        <Skeleton className="h-40 w-full" />
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-6 w-16 rounded-full" />
                            ))}
                          </div>
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-5/6" />
                          <div className="flex items-center mt-2">
                            <Skeleton className="h-6 w-24 rounded-full mr-2" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Skeleton className="h-9 w-28" />
                          <Skeleton className="h-9 w-28" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

