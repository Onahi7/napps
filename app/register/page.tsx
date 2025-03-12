"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClientBrowser } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getNigeriaStates } from "@/lib/nigeria-data"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    phone: "",
    email: "",
    
    // School Information
    school_name: "",
    school_address: "",
    school_city: "",
    school_state: "",
    school_type: "",
    
    // NAPPS Information
    napps_position: "",
    napps_chapter: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.full_name || !formData.phone || !formData.email) {
        setError("Personal information fields are required")
        setIsLoading(false)
        return
      }

      if (!formData.email.includes("@")) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      if (!formData.school_name || !formData.school_address || !formData.school_state) {
        setError("School information fields are required")
        setIsLoading(false)
        return
      }

      // Check if email or phone already exists
      const supabase = createClientBrowser()
      
      // Check for duplicate email
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle()

      if (existingEmail) {
        setError("Email already registered")
        setIsLoading(false)
        return
      }

      // Check for duplicate phone
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", formData.phone)
        .maybeSingle()

      if (existingPhone) {
        setError("Phone number already registered")
        setIsLoading(false)
        return
      }

      // Register user with NextAuth and Supabase
      const registrationAmount = 25000 // ₦25,000 registration fee
      
      const result = await register(
        formData.email,
        formData.phone,
        {
          full_name: formData.full_name,
          phone: formData.phone,
          role: "participant",
          school_name: formData.school_name,
          school_address: formData.school_address,
          school_city: formData.school_city,
          school_state: formData.school_state,
          school_type: formData.school_type,
          napps_position: formData.napps_position,
          napps_chapter: formData.napps_chapter,
        }
      )

      if (!result.success) {
        setError(result.error || "Registration failed")
        setIsLoading(false)
        return
      }

      // Initialize payment with Paystack
      type PaymentResponse = {
        success: boolean
        authorizationUrl?: string
        message?: string
      }

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          amount: registrationAmount * 100,
          metadata: {
            userId: (result as { userId: string }).userId,
            name: formData.full_name,
            phone: formData.phone,
            school: formData.school_name
          }
        }),
      })

      const paymentResponse = (await response.json()) as PaymentResponse

      if (paymentResponse.success && paymentResponse.authorizationUrl) {
        // Redirect to payment page
        window.location.href = paymentResponse.authorizationUrl
      } else {
        setError(paymentResponse.message || "Payment initialization failed")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "An error occurred during registration")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-napps-gold" />
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Enter your details to register for the summit</p>
        </div>

        <Card className="border-napps-gold/30 card-glow">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Register</CardTitle>
              <CardDescription>Fill in the form below to create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="text-sm font-medium text-destructive">{error}</div>}
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="08012345678"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
              </div>
              
              {/* School Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">School Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    name="school_name"
                    placeholder="ABC International School"
                    value={formData.school_name}
                    onChange={handleChange}
                    required
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_address">School Address</Label>
                  <Textarea
                    id="school_address"
                    name="school_address"
                    placeholder="123 School Street"
                    value={formData.school_address}
                    onChange={handleChange}
                    required
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_city">City</Label>
                    <Input
                      id="school_city"
                      name="school_city"
                      placeholder="City"
                      value={formData.school_city}
                      onChange={handleChange}
                      className="border-napps-gold/30 focus-visible:ring-napps-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_state">State</Label>
                    <Select
                      value={formData.school_state}
                      onValueChange={(value) => handleSelectChange("school_state", value)}
                    >
                      <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {getNigeriaStates().map((state: string) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_type">School Type</Label>
                  <Select
                    value={formData.school_type}
                    onValueChange={(value) => handleSelectChange("school_type", value)}
                  >
                    <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary School</SelectItem>
                      <SelectItem value="secondary">Secondary School</SelectItem>
                      <SelectItem value="both">Both Primary and Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* NAPPS Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">NAPPS Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="napps_position">Position in NAPPS</Label>
                  <Select
                    value={formData.napps_position}
                    onValueChange={(value) => handleSelectChange("napps_position", value)}
                  >
                    <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                      <SelectValue placeholder="Select your position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chairman">Chairman</SelectItem>
                      <SelectItem value="vice_chairman">Vice Chairman</SelectItem>
                      <SelectItem value="secretary">Secretary</SelectItem>
                      <SelectItem value="treasurer">Treasurer</SelectItem>
                      <SelectItem value="financial_secretary">Financial Secretary</SelectItem>
                      <SelectItem value="pro">Public Relations Officer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="napps_chapter">NAPPS Chapter/Branch</Label>
                  <Input
                    id="napps_chapter"
                    name="napps_chapter"
                    placeholder="e.g., Lafia Chapter"
                    value={formData.napps_chapter}
                    onChange={handleChange}
                    className="border-napps-gold/30 focus-visible:ring-napps-gold"
                  />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                By registering, you agree to our{" "}
                <Link href="/terms" className="text-napps-gold hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-napps-gold hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-napps-gold text-black hover:bg-napps-gold/90 shadow-gold"
                disabled={isLoading}
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Register & Proceed to Payment
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-napps-gold hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
