"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from "next/navigation"
import { Loader2, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { getConfig, getConferenceDetails, type ConferenceDetails } from "@/lib/config-service"

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrationAmount, setRegistrationAmount] = useState<number | null>(null)
  const [conferenceDetails, setConferenceDetails] = useState<ConferenceDetails>({
    name: '',
    date: '',
    venue: '',
    theme: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [config, details] = await Promise.all([
          getConfig("registrationAmount"),
          getConferenceDetails()
        ])
        setRegistrationAmount(config ? Number.parseFloat(config) : 0)
        setConferenceDetails(details)
      } catch (error) {
        console.error("Error fetching data:", error)
        setRegistrationAmount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (status === 'loading' || loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    );
  }

  const profile = session.user;
  const isPaid = profile.payment_status === "paid"

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Welcome, {profile.full_name}</h1>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{conferenceDetails.name}</CardTitle>
            <CardDescription>
              "{conferenceDetails.theme}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{conferenceDetails.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{conferenceDetails.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>For stakeholders across the North Central Zone</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <span>Status:</span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  isPaid
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {isPaid ? "Registered" : "Pending Payment"}
              </span>
            </div>
            {!isPaid && (
              <div className="mb-4">
                <p className="mb-2">Registration Fee:</p>
                <p className="text-2xl font-bold">
                  {registrationAmount === null ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    `₦${registrationAmount.toLocaleString()}`
                  )}
                </p>
              </div>
            )}
            {!isPaid && (
              <Link href="/payment">
                <Button className="w-full">Pay Registration Fee</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{profile.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{profile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">State:</span>
                <span>{profile.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">LGA:</span>
                <span>{profile.lga}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Chapter:</span>
                <span>{profile.chapter}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPaid && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Conference Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Thank you for registering for {conferenceDetails.name}. We look
                forward to seeing you at the event.
              </p>
              <div className="rounded-md bg-primary/10 p-4">
                <h3 className="mb-2 font-semibold">Important Information</h3>
                <ul className="list-inside list-disc space-y-1">
                  <li>Please arrive at least 30 minutes before the event starts for registration</li>
                  <li>Bring your ID and registration confirmation</li>
                  <li>Accommodation information will be sent to your email</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

