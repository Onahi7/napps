"use client"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MaintenanceStats {
  tables: Array<{
    table_name: string
    row_count: number
    dead_tuples: number
    last_vacuum: string
    last_analyze: string
  }>
  size: {
    total_size: string
    users_size: string
    profiles_size: string
    scans_size: string
    bookings_size: string
  }
  connections: {
    total_connections: number
    active_connections: number
    idle_connections: number
    waiting_connections: number
    totalCount: number
    idleCount: number
    waitingCount: number
  }
}

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/maintenance')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data.statistics)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchStats])

  const runMaintenance = async (action: string) => {
    try {
      setActionInProgress(action)
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) throw new Error('Maintenance action failed')
      
      const data = await response.json()
      toast({
        title: 'Success',
        description: data.message
      })
      
      // Refresh stats
      await fetchStats()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setActionInProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Database Maintenance</h1>

      {/* Database Size */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Database Size</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Size</p>
            <p className="text-2xl font-bold">{stats?.size.total_size}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-2xl font-bold">{stats?.size.users_size}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profiles</p>
            <p className="text-2xl font-bold">{stats?.size.profiles_size}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scans</p>
            <p className="text-2xl font-bold">{stats?.size.scans_size}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bookings</p>
            <p className="text-2xl font-bold">{stats?.size.bookings_size}</p>
          </div>
        </div>
      </Card>

      {/* Connection Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Connection Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Active Connections</p>
            <p className="text-2xl font-bold">{stats?.connections.active_connections}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Idle Connections</p>
            <p className="text-2xl font-bold">{stats?.connections.idle_connections}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pool Size</p>
            <p className="text-2xl font-bold">{stats?.connections.totalCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Waiting Queries</p>
            <p className="text-2xl font-bold">{stats?.connections.waiting_connections}</p>
          </div>
        </div>
      </Card>

      {/* Table Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Table Statistics</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead className="text-right">Dead Tuples</TableHead>
              <TableHead>Last Vacuum</TableHead>
              <TableHead>Last Analyze</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats?.tables.map((table) => (
              <TableRow key={table.table_name}>
                <TableCell className="font-medium">{table.table_name}</TableCell>
                <TableCell className="text-right">{table.row_count}</TableCell>
                <TableCell className="text-right">{table.dead_tuples}</TableCell>
                <TableCell>{new Date(table.last_vacuum).toLocaleString()}</TableCell>
                <TableCell>{new Date(table.last_analyze).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Maintenance Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => runMaintenance('vacuum')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'vacuum' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Vacuum Analyze
          </Button>
          
          <Button
            variant="outline"
            onClick={() => runMaintenance('reindex')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'reindex' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reindex Tables
          </Button>
          
          <Button
            variant="outline"
            onClick={() => runMaintenance('cleanup')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'cleanup' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Cleanup Old Scans
          </Button>
          
          <Button
            variant="outline"
            onClick={() => runMaintenance('optimize')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'optimize' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Optimize Search
          </Button>
          
          <Button
            variant="outline"
            onClick={() => runMaintenance('kill_idle')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'kill_idle' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Kill Idle Connections
          </Button>
          
          <Button
            variant="outline"
            onClick={() => runMaintenance('reset_pool')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'reset_pool' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reset Connection Pool
          </Button>
          
          <Button
            variant="default"
            className="col-span-full"
            onClick={() => runMaintenance('full_maintenance')}
            disabled={!!actionInProgress}
          >
            {actionInProgress === 'full_maintenance' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Run Full Maintenance
          </Button>
        </div>
      </Card>
    </div>
  )
}