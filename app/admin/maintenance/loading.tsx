import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MaintenanceLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Database Maintenance</h1>

      {/* Database Size Loading */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Database Size</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array(5).fill(null).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </Card>

      {/* Connection Stats Loading */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Connection Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </Card>

      {/* Table Stats Loading */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Table Statistics</h2>
        <div className="space-y-4">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
      </Card>

      {/* Maintenance Actions Loading */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(7).fill(null).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`h-10 ${i === 6 ? 'col-span-full' : ''}`}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}