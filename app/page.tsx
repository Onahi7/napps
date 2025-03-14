"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Calendar, CheckCircle, CreditCard, QrCode, Users, School } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (session?.user) {
      // Check user role and redirect accordingly
      if (session.user.role === "admin") {
        router.push("/admin/dashboard")
      } else if (session.user.role === "validator") {
        router.push("/validator/dashboard")
      } else {
        router.push("/participant/dashboard")
      }
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-napps-green/10 to-white dark:from-napps-green/20 dark:to-background">
      <header className="bg-white dark:bg-background shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <School className="h-8 w-8 text-napps-green" />
            <h1 className="text-2xl font-bold text-napps-green">NAPPS Conference</h1>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="bg-napps-green hover:bg-napps-green/90" asChild>
              <Link href="/pre-register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-napps-green">
            6th Annual NAPPS North Central Zonal Education Summit 2025
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            May 21-22, 2025 | Lafia City Hall, Lafia
          </p>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-200 max-w-3xl mx-auto mb-8">
            "ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE"
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-napps-green hover:bg-napps-green/90" asChild>
              <Link href="/pre-register">Register Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Access Dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <Calendar className="h-8 w-8 text-napps-green mb-2" />
              <CardTitle>Event Details</CardTitle>
              <CardDescription>All the information you need</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Get all the details about the upcoming conference, including schedules, speakers, and venue information.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-napps-green/50 text-napps-green hover:bg-napps-green/10"
              >
                Learn More
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-napps-green mb-2" />
              <CardTitle>Registration</CardTitle>
              <CardDescription>Secure your spot today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Register for the conference with our easy payment system. Join educators from across the North Central
                Zone.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-napps-green/50 text-napps-green hover:bg-napps-green/10"
                asChild
              >
                <Link href="/pre-register">Register Now</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <QrCode className="h-8 w-8 text-napps-green mb-2" />
              <CardTitle>QR System</CardTitle>
              <CardDescription>Seamless conference experience</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Our QR code system makes conference accreditation and meal validation quick and easy for all
                participants.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-napps-green/50 text-napps-green hover:bg-napps-green/10"
              >
                How It Works
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="bg-napps-green/10 dark:bg-napps-green/20 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center text-napps-green">Why Attend?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-napps-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Networking</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect with fellow educators and industry leaders</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <BookOpen className="h-12 w-12 text-napps-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Learning</h3>
              <p className="text-gray-600 dark:text-gray-300">Access valuable resources and educational content</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-12 w-12 text-napps-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Updates</h3>
              <p className="text-gray-600 dark:text-gray-300">Stay current with the latest educational trends</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-napps-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">Certification</h3>
              <p className="text-gray-600 dark:text-gray-300">Receive certificates of participation</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-napps-green text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">NAPPS Conference</h3>
              <p className="text-napps-gold">6th Annual NAPPS North Central Zonal Education Summit 2025</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/pre-register" className="text-napps-gold hover:text-white">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-napps-gold hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-napps-gold hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-napps-gold hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <p className="text-napps-gold">Email: info@nappsconference.org</p>
              <p className="text-napps-gold">Phone: +234 123 456 7890</p>
            </div>
          </div>
          <div className="border-t border-napps-green-dark mt-8 pt-8 text-center text-napps-gold">
            <p>&copy; {new Date().getFullYear()} NAPPS Conference. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

