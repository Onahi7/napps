"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Registration {
  id: string
  full_name: string
  email: string
  phone: string
  school_name: string
  school_state: string
  napps_chapter: string
  payment_status: string
  accreditation_status: string
  created_at: string
}

export function AdminRegistrationList() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRegistrations()
  }, [])

  async function fetchRegistrations() {
    try {
      const response = await fetch('/api/admin/registrations')
      if (!response.ok) {
        throw new Error('Failed to fetch registrations')
      }
      const data = await response.json()
      setRegistrations(data)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No registrations found</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Chapter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>{registration.full_name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{registration.email}</span>
                  <span className="text-sm text-muted-foreground">{registration.phone}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{registration.school_name}</span>
                  <span className="text-sm text-muted-foreground">{registration.school_state}</span>
                </div>
              </TableCell>
              <TableCell>{registration.napps_chapter}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge
                    variant={registration.payment_status === 'completed' ? 'default' : 'secondary'}
                  >
                    {registration.payment_status === 'completed' ? 'Paid' : 'Pending Payment'}
                  </Badge>
                  <Badge
                    variant={registration.accreditation_status === 'completed' ? 'default' : 'secondary'}
                  >
                    {registration.accreditation_status === 'completed' ? 'Accredited' : 'Not Accredited'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRegistration(registration)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  {selectedRegistration && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                        <DialogDescription>
                          View complete registration information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Personal Information</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Full Name:</span>
                              <span>{selectedRegistration.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span>{selectedRegistration.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone:</span>
                              <span>{selectedRegistration.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">School Information</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">School Name:</span>
                              <span>{selectedRegistration.school_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">State:</span>
                              <span>{selectedRegistration.school_state}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">NAPPS Chapter:</span>
                              <span>{selectedRegistration.napps_chapter}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">Status Information</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Registered On:</span>
                              <span>{new Date(selectedRegistration.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Status:</span>
                              <Badge variant={selectedRegistration.payment_status === 'completed' ? 'default' : 'secondary'}>
                                {selectedRegistration.payment_status === 'completed' ? 'Paid' : 'Pending Payment'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Accreditation Status:</span>
                              <Badge variant={selectedRegistration.accreditation_status === 'completed' ? 'default' : 'secondary'}>
                                {selectedRegistration.accreditation_status === 'completed' ? 'Accredited' : 'Not Accredited'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}