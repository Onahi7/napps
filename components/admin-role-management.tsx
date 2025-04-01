"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, UserPlus, Shield, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersData, rolesData, permissionsData] = await Promise.all([
        fetch('/api/admin/users').then(res => res.json()),
        fetch('/api/admin/roles').then(res => res.json()),
        fetch('/api/admin/permissions').then(res => res.json())
      ])

      setUsers(usersData)
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load user and role data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })

      if (!response.ok) throw new Error('Failed to update user role')

      toast({
        title: "Success",
        description: "User role updated successfully"
      })

      fetchData()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    }
  }

  const handleRoleUpdate = async (roleId: string, permissions: string[]) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissions })
      })

      if (!response.ok) throw new Error('Failed to update role permissions')

      toast({
        title: "Success",
        description: "Role permissions updated successfully"
      })

      fetchData()
    } catch (error) {
      console.error('Error updating role permissions:', error)
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleUpdateUser(user.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{role.name}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        id={`${role.id}-${permission.id}`}
                        checked={role.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          const newPermissions = checked
                            ? [...role.permissions, permission.id]
                            : role.permissions.filter(p => p !== permission.id)
                          handleRoleUpdate(role.id, newPermissions)
                        }}
                      />
                      <Label htmlFor={`${role.id}-${permission.id}`}>
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Settings</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={selectedUser.name} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => {
                    handleUpdateUser(selectedUser.id, value)
                    setIsEditDialogOpen(false)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}