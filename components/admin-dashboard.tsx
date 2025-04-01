"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, FileText, Settings, CheckSquare } from "lucide-react"
import Link from "next/link"
import { getUsersByRole } from "@/actions/user-actions"
import { getRegistrationAmount, getConferenceDetails } from "@/lib/config-service"
import { getResourceStats } from "@/actions/resource-actions"
import type { ResourceType } from "@prisma/client"

interface ResourceStats {
  total_resources: number;
  public_resources: number;
  recent_resources: number;
  categories: Array<{
    category: ResourceType;
    count: number;
  }>;
}

export function AdminDashboard() {
  const [participants, setParticipants] = useState<any[]>([])
  const [validators, setValidators] = useState<any[]>([])
  const [registrationAmount, setRegistrationAmount] = useState<number>(0)
  const [conferenceDetails, setConferenceDetails] = useState({
    name: "",
    date: "",
    venue: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [resourceStats, setResourceStats] = useState<ResourceStats>({
    total_resources: 0,
    public_resources: 0,
    recent_resources: 0,
    categories: []
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [participantsData, validatorsData, amount, details, stats] = await Promise.all([
          getUsersByRole("PARTICIPANT"),
          getUsersByRole("VALIDATOR"),
          getRegistrationAmount(),
          getConferenceDetails(),
          getResourceStats()
        ])

        setParticipants(participantsData)
        setValidators(validatorsData)
        setRegistrationAmount(amount)
        setResourceStats(stats)

        if (details) {
          setConferenceDetails({
            name: details.name || conferenceDetails.name,
            date: details.date || conferenceDetails.date,
            venue: details.venue || conferenceDetails.venue,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate statistics
  const totalParticipants = participants.length
  const paidParticipants = participants.filter((p) => p.payment_status === "paid").length
  const pendingParticipants = totalParticipants - paidParticipants
  const totalRevenue = paidParticipants * registrationAmount
  const accreditedParticipants = participants.filter((p) => p.accreditation_status === "approved").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conference Details</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conferenceDetails.name}</div>
          <p className="text-xs text-muted-foreground">
            {conferenceDetails.date} • {conferenceDetails.venue}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Registration Fee: ₦{20000}</p>
        </CardContent>
        <CardFooter>
          <Link href="/admin/settings" className="w-full">
            <Button variant="outline" className="w-full">
              Manage Settings
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Participants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalParticipants}</div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-muted-foreground">Paid: {paidParticipants}</p>
            <p className="text-xs text-muted-foreground">Pending: {pendingParticipants}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/admin/participants">
            <Button variant="outline">View All</Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From {paidParticipants} paid registrations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accreditation</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{accreditedParticipants}</div>
          <p className="text-xs text-muted-foreground">Accredited participants</p>
        </CardContent>
        <CardFooter>
          <Link href="/admin/accreditation" className="w-full">
            <Button variant="outline" className="w-full">
              Manage Accreditation
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Validators</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{validators.length}</div>
          <p className="text-xs text-muted-foreground">Active validators</p>
        </CardContent>
        <CardFooter>
          <Link href="/admin/validators" className="w-full">
            <Button variant="outline" className="w-full">
              Manage Validators
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resources</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resourceStats.total_resources}</div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Public: {resourceStats.public_resources}</span>
            <span>New (7d): {resourceStats.recent_resources}</span>
          </div>
          {resourceStats.categories.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Categories:</p>
              <div className="space-y-1">
                {resourceStats.categories.map((cat: any) => (
                  <div key={cat.category} className="flex justify-between text-xs">
                    <span>{cat.category}</span>
                    <span>{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/admin/resources" className="w-full">
            <Button variant="outline" className="w-full">
              Manage Resources
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AdminDashboard;

