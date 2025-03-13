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
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getNigeriaStates } from "@/lib/nigeria-data"
import { initializePayment } from "@/lib/paystack"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrationAmount, setRegistrationAmount] = useState(15000) // Default amount
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    school_name: "",
    school_address: "",
    school_state: "",
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
      // Basic validation
      if (!formData.full_name || !formData.phone || !formData.email) {
        setError("Personal information fields are required")
        setIsLoading(false)
        return
      }

      const result = await register({
        email: formData.email,
        phone: formData.phone,
        full_name: formData.full_name,
        password: "", // since this is participant registration
        organization: formData.school_name,
        state: formData.school_state,
        chapter: formData.napps_chapter
      })

      if (!result.success) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Directly initialize payment after successful registration
      try {
        const paymentUrl = await initializePayment({
          email: formData.email,
          amount: registrationAmount,
          metadata: {
            name: formData.full_name,
            email: formData.email
          },
        })

        if (paymentUrl) {
          window.location.href = paymentUrl.authorization_url
        } else {
          throw new Error("Payment initialization failed")
        }
      } catch (paymentError: any) {
        console.error("Payment initialization failed:", paymentError)
        // Still redirect to success page even if payment initialization fails
        // They can try payment again from the dashboard
        router.push('/registration-success')
      }
      
    } catch (error: any) {
      setError(error.message || "Registration failed")
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
          <h1 className="text-2xl font-semibold tracking-tight">Register & Pay</h1>
          <p className="text-sm text-muted-foreground">Enter your details to register and pay for the summit</p>
        </div>
        <Card className="border-napps-gold/30 card-glow">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Quick Registration</CardTitle>
              <CardDescription>Fill in the form below to create your account and proceed to payment</CardDescription>
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
                <h3 className="text-lg font-medium">School & NAPPS Information</h3>
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
              
              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Information</h3>
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span>Registration Fee:</span>
                    <span className="text-xl font-bold">₦{registrationAmount?.toLocaleString()}</span>
                  </div>
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Register & Pay Now"
                )}
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
