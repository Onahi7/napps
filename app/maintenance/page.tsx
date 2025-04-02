'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateSystemConfig, getSystemConfig, type SystemConfig } from '@/actions/config-actions'

export default function MaintenancePage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const conf = await getSystemConfig()
        setConfig(conf)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load system configuration',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [toast])

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      const result = await updateSystemConfig({ maintenanceMode: enabled })
      if (result) {
        setConfig(prev => prev ? { ...prev, maintenanceMode: enabled } : null)
        toast({
          title: 'Success',
          description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
        })
      } else {
        throw new Error('Failed to update maintenance mode')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update maintenance mode',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">System Maintenance</h1>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the system will be inaccessible to regular users
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={config?.maintenanceMode || false}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>
          {config?.maintenanceMode && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ The system is currently in maintenance mode. Only administrators can access it.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}