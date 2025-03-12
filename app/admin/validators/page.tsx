"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, User, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

export default function AdminValidators() {
  const [validators, setValidators] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      phone: "08012345678",
      role: "Breakfast",
      status: "Active",
      validations: 78,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "08023456789",
      role: "Dinner",
      status: "Active",
      validations: 65,
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael@example.com",
      phone: "08034567890",
      role: "Accreditation",
      status: "Active",
      validations: 112,
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      phone: "08045678901",
      role: "Breakfast",
      status: "Inactive",
      validations: 0,
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david@example.com",
      phone: "08056789012",
      role: "Dinner",
      status: "Active",
      validations: 43,
    },
  ])

  const [newValidator, setNewValidator] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Breakfast",
  })

  const handleAddValidator = () => {
    const validator = {
      id: validators.length + 1,
      name: newValidator.name,
      email: newValidator.email,
      phone: newValidator.phone,
      role: newValidator.role,
      status: "Active",
      validations: 0,
    }

    setValidators([...validators, validator])
    setNewValidator({
      name: "",
      email: "",
      phone: "",
      role: "Breakfast",
    })
  }

  const toggleValidatorStatus = (id: number) => {
    setValidators(
      validators.map((validator) =>
        validator.id === id
          ? { ...validator, status: validator.status === "Active" ? "Inactive" : "Active" }
          : validator,
      ),
    )
  }

  const deleteValidator = (id: number) => {
    setValidators(validators.filter((validator) => validator.id !== id))
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Validator Management" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Validators</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-napps-green hover:bg-napps-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Validator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Validator</DialogTitle>
                  <DialogDescription>
                    Create a new validator account for meal and accreditation validation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newValidator.name}
                      onChange={(e) => setNewValidator({ ...newValidator, name: e.target.value })}
                      className="border-napps-green/30 focus-visible:ring-napps-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newValidator.email}
                      onChange={(e) => setNewValidator({ ...newValidator, email: e.target.value })}
                      className="border-napps-green/30 focus-visible:ring-napps-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newValidator.phone}
                      onChange={(e) => setNewValidator({ ...newValidator, phone: e.target.value })}
                      className="border-napps-green/30 focus-visible:ring-napps-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Validation Role</Label>
                    <Select
                      value={newValidator.role}
                      onValueChange={(value) => setNewValidator({ ...newValidator, role: value })}
                    >
                      <SelectTrigger className="border-napps-green/30 focus-visible:ring-napps-green">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Breakfast">Breakfast Validator</SelectItem>
                        <SelectItem value="Dinner">Dinner Validator</SelectItem>
                        <SelectItem value="Accreditation">Accreditation Validator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-napps-green/30">
                    Cancel
                  </Button>
                  <Button className="bg-napps-green hover:bg-napps-green/90" onClick={handleAddValidator}>
                    Create Validator
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <CardTitle>Validator Overview</CardTitle>
              <CardDescription>Manage validators for meal and accreditation validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Total Validators</h3>
                  <p className="text-3xl font-bold">{validators.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {validators.filter((v) => v.status === "Active").length} active
                  </p>
                </div>
                <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Total Validations</h3>
                  <p className="text-3xl font-bold">{validators.reduce((sum, v) => sum + v.validations, 0)}</p>
                  <p className="text-sm text-muted-foreground">Across all validators</p>
                </div>
                <div className="rounded-lg bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Top Validator</h3>
                  <p className="text-xl font-bold">
                    {validators.sort((a, b) => b.validations - a.validations)[0]?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {validators.sort((a, b) => b.validations - a.validations)[0]?.validations} validations
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-napps-green/20">
                <div className="grid grid-cols-7 border-b p-3 font-medium">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Phone</div>
                  <div>Role</div>
                  <div>Validations</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {validators.map((validator) => (
                  <div key={validator.id} className="grid grid-cols-7 border-b p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-napps-green" />
                      <span>{validator.name}</span>
                    </div>
                    <div>{validator.email}</div>
                    <div>{validator.phone}</div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          validator.role === "Breakfast"
                            ? "bg-napps-green/20 text-napps-green dark:bg-napps-green/30 dark:text-napps-gold"
                            : validator.role === "Dinner"
                              ? "bg-napps-gold/20 text-napps-gold dark:bg-napps-gold/30"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {validator.role}
                      </span>
                    </div>
                    <div>{validator.validations}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={validator.status === "Active"}
                          onCheckedChange={() => toggleValidatorStatus(validator.id)}
                          className="data-[state=checked]:bg-napps-green"
                        />
                        <span
                          className={`text-sm ${
                            validator.status === "Active" ? "text-napps-green" : "text-muted-foreground"
                          }`}
                        >
                          {validator.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-napps-green">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => deleteValidator(validator.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader>
                <CardTitle>Validation Performance</CardTitle>
                <CardDescription>Recent validation activity by validators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validators
                    .filter((v) => v.status === "Active")
                    .sort((a, b) => b.validations - a.validations)
                    .slice(0, 5)
                    .map((validator) => (
                      <div key={validator.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-napps-green" />
                          <div>
                            <p className="font-medium">{validator.name}</p>
                            <p className="text-sm text-muted-foreground">{validator.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{validator.validations}</p>
                          <p className="text-sm text-muted-foreground">validations</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest validation actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      validator: "John Smith",
                      action: "Validated breakfast",
                      time: "10 minutes ago",
                      success: true,
                    },
                    {
                      id: 2,
                      validator: "Sarah Johnson",
                      action: "Validated dinner",
                      time: "25 minutes ago",
                      success: true,
                    },
                    {
                      id: 3,
                      validator: "Michael Brown",
                      action: "Validated accreditation",
                      time: "1 hour ago",
                      success: true,
                    },
                    {
                      id: 4,
                      validator: "Sarah Johnson",
                      action: "Failed validation attempt",
                      time: "2 hours ago",
                      success: false,
                    },
                    {
                      id: 5,
                      validator: "David Wilson",
                      action: "Validated dinner",
                      time: "3 hours ago",
                      success: true,
                    },
                  ].map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      {activity.success ? (
                        <CheckCircle className="h-5 w-5 text-napps-green flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{activity.validator}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

