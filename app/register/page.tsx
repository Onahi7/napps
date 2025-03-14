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
import { getNigeriaStates } from "@/lib/nigeria-data"
import { initializePayment } from "@/actions/payment-actions"
import { Loader2 } from "lucide-react"

type ValidationErrors = {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [registrationAmount] = useState(15000) // This will be fetched from config in production
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    school_name: "",
    school_state: "",
    napps_chapter: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: ValidationErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.school_name.trim()) {
      newErrors.school_name = "School name is required"
    }

    if (!formData.school_state) {
      newErrors.school_state = "School state is required"
    }

    if (!formData.napps_chapter.trim()) {
      newErrors.napps_chapter = "NAPPS chapter is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const result = await register({
        email: formData.email,
        phone: formData.phone.replace(/\s+/g, ''), // Remove spaces from phone
        full_name: formData.full_name.trim(),
        password: "NAPPS2025", // Default password for participants
        organization: formData.school_name,
        state: formData.school_state,
        chapter: formData.napps_chapter
      })

      if (!result.success) {
        setErrors({ submit: result.error || "Registration failed" })
        return
      }

      // Directly redirect to payment page instead of initializing Paystack
      router.push('/payment')
      
    } catch (error: any) {
      setErrors({ submit: error.message || "Registration failed" })
    } finally {
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
          <h1 className="text-2xl font-semibold tracking-tight">Register</h1>
          <p className="text-sm text-muted-foreground">Enter your details to register for the summit</p>
        </div>

        <Card className="border-napps-gold/30 card-glow">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl">Quick Registration</CardTitle>
              <CardDescription>Fill in the form below to create your account and proceed to payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.submit && (
                <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                  {errors.submit}
                </div>
              )}
              
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
                    className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.full_name ? "border-destructive" : ""
                    }`}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.email ? "border-destructive" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="080xxxxxxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.phone ? "border-destructive" : ""
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
              </div>
              
              {/* School Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">School Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    name="school_name"
                    placeholder="Example International School"
                    value={formData.school_name}
                    onChange={handleChange}
                    className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.school_name ? "border-destructive" : ""
                    }`}
                  />
                  {errors.school_name && (
                    <p className="text-sm text-destructive">{errors.school_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_state">School State</Label>
                  <Select
                    name="school_state"
                    value={formData.school_state}
                    onValueChange={(value) => handleSelectChange("school_state", value)}
                  >
                    <SelectTrigger className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.school_state ? "border-destructive" : ""
                    }`}>
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
                  {errors.school_state && (
                    <p className="text-sm text-destructive">{errors.school_state}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="napps_chapter">NAPPS Chapter/Branch</Label>
                  <Input
                    id="napps_chapter"
                    name="napps_chapter"
                    placeholder="e.g., Lafia Chapter"
                    value={formData.napps_chapter}
                    onChange={handleChange}
                    className={`border-napps-gold/30 focus-visible:ring-napps-gold ${
                      errors.napps_chapter ? "border-destructive" : ""
                    }`}
                  />
                  {errors.napps_chapter && (
                    <p className="text-sm text-destructive">{errors.napps_chapter}</p>
                  )}
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    After registration, you will receive bank transfer details and a unique payment reference code.
                  </p>
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
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-napps-gold text-black hover:bg-napps-gold/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
