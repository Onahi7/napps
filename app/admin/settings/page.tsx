"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserRoleManagement } from "@/components/admin-role-management"

interface ConferenceConfig {
  name: string;
  date: string;
  venue: string;
  theme: string;
  registrationOpen: boolean;
  maxParticipants: number;
  registrationFee: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  contactEmail: string;
  description: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  analyticsEnabled: boolean;
  fileUploadLimit: number;
  defaultResourceVisibility: "public" | "private";
  resourceCategories: string[];
  emailNotifications: boolean;
  timezone: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("conference")
  const [saving, setSaving] = useState(false)
  const [conferenceConfig, setConferenceConfig] = useState<ConferenceConfig>({
    name: "",
    date: "",
    venue: "",
    theme: "",
    registrationOpen: true,
    maxParticipants: 500,
    registrationFee: 20000,
    bankName: "Unity Bank",
    accountNumber: "0017190877",
    accountName: "N.A.A.PS NASARAWA STATE",
    contactEmail: "",
    description: ""
  })

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    debugMode: false,
    analyticsEnabled: true,
    fileUploadLimit: 5,
    defaultResourceVisibility: "private",
    resourceCategories: [],
    emailNotifications: true,
    timezone: "Africa/Lagos"
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to load settings')
      const data = await response.json()
      
      setConferenceConfig({
        name: data.name || "",
        date: data.date || "",
        venue: data.venue || "",
        theme: data.theme || "",
        registrationOpen: data.registrationOpen ?? true,
        maxParticipants: data.maxParticipants || 500,
        registrationFee: data.registrationFee || 20000,
        bankName: data.bankName || "Unity Bank",
        accountNumber: data.accountNumber || "0017190877",
        accountName: data.accountName || "N.A.A.PS NASARAWA STATE",
        contactEmail: data.contactEmail || "",
        description: data.description || ""
      })

      setSystemConfig({
        maintenanceMode: data.maintenanceMode || false,
        debugMode: data.debugMode || false,
        analyticsEnabled: data.analyticsEnabled ?? true,
        fileUploadLimit: data.fileUploadLimit || 5,
        defaultResourceVisibility: data.defaultResourceVisibility || "private",
        resourceCategories: data.resourceCategories || [],
        emailNotifications: data.emailNotifications ?? true,
        timezone: data.timezone || "Africa/Lagos"
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conference: conferenceConfig,
          system: systemConfig
        })
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast({
        title: "Success",
        description: "Settings saved successfully"
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = () => {
    const category = prompt("Enter new resource category:")
    if (category) {
      setSystemConfig(prev => ({
        ...prev,
        resourceCategories: [...prev.resourceCategories, category]
      }))
    }
  }

  const handleRemoveCategory = (index: number) => {
    setSystemConfig(prev => ({
      ...prev,
      resourceCategories: prev.resourceCategories.filter((_, i) => i !== index)
    }))
  }

  return (
    <DashboardLayout role="admin" title="Settings">
      <div className="container max-w-5xl py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="conference">Conference Settings</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="conference" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conference Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Conference Name</Label>
                      <Input
                        id="name"
                        value={conferenceConfig.name}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Conference Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={conferenceConfig.date}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={conferenceConfig.venue}
                      onChange={e => setConferenceConfig(prev => ({ ...prev, venue: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="theme">Conference Theme</Label>
                    <Input
                      id="theme"
                      value={conferenceConfig.theme}
                      onChange={e => setConferenceConfig(prev => ({ ...prev, theme: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={conferenceConfig.description}
                      onChange={e => setConferenceConfig(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="registrationFee">Registration Fee (₦)</Label>
                      <Input
                        id="registrationFee"
                        type="number"
                        value={conferenceConfig.registrationFee}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, registrationFee: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxParticipants">Maximum Participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={conferenceConfig.maxParticipants}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="registrationOpen"
                      checked={conferenceConfig.registrationOpen}
                      onCheckedChange={checked => setConferenceConfig(prev => ({ ...prev, registrationOpen: checked }))}
                    />
                    <Label htmlFor="registrationOpen">Registration Open</Label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={conferenceConfig.bankName}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, bankName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={conferenceConfig.accountNumber}
                        onChange={e => setConferenceConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={conferenceConfig.accountName}
                      onChange={e => setConferenceConfig(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={conferenceConfig.contactEmail}
                      onChange={e => setConferenceConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to temporarily disable access
                        </p>
                      </div>
                      <Switch
                        checked={systemConfig.maintenanceMode}
                        onCheckedChange={checked => setSystemConfig(prev => ({ ...prev, maintenanceMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Debug Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable detailed error messages and logging
                        </p>
                      </div>
                      <Switch
                        checked={systemConfig.debugMode}
                        onCheckedChange={checked => setSystemConfig(prev => ({ ...prev, debugMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable usage tracking and analytics
                        </p>
                      </div>
                      <Switch
                        checked={systemConfig.analyticsEnabled}
                        onCheckedChange={checked => setSystemConfig(prev => ({ ...prev, analyticsEnabled: checked }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fileUploadLimit">File Upload Limit (MB)</Label>
                      <Input
                        id="fileUploadLimit"
                        type="number"
                        value={systemConfig.fileUploadLimit}
                        onChange={e => setSystemConfig(prev => ({ ...prev, fileUploadLimit: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultVisibility">Default Resource Visibility</Label>
                      <Select
                        value={systemConfig.defaultResourceVisibility}
                        onValueChange={value => setSystemConfig(prev => ({ ...prev, defaultResourceVisibility: value as "public" | "private" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Resource Categories</Label>
                        <Button type="button" variant="outline" onClick={handleAddCategory}>
                          Add Category
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {systemConfig.resourceCategories.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span>{category}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveCategory(index)}
                              className="h-8 w-8 p-0"
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable system email notifications
                        </p>
                      </div>
                      <Switch
                        checked={systemConfig.emailNotifications}
                        onCheckedChange={checked => setSystemConfig(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={systemConfig.timezone}
                        onValueChange={value => setSystemConfig(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <UserRoleManagement />
            </TabsContent>

            <div className={`mt-6 flex justify-end ${activeTab === 'roles' ? 'hidden' : ''}`}>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

