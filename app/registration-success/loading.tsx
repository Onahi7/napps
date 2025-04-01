import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <Skeleton className="mx-auto h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

