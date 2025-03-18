import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function PreRegisterLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-3xl">
        <div className="flex flex-col space-y-2 text-center">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-20 w-full" />

            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

