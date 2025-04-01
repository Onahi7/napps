"use client"
import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Upload, Bell, Lock, CreditCard, Loader2, School, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { updateProfile } from "@/actions/profile-actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ParticipantProfile() {
  const { user, profile, loading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    bio: "",
    dietaryRequirements: "",
    emailNotifications: true,
    smsNotifications: false,
    schoolName: "",
    schoolAddress: "",
    schoolCity: "",
    schoolState: "",
    schoolType: "",
    nappsPosition: "",
    nappsChapter: ""
  })

  useEffect(() => {
    if (profile) {
      const nameParts = profile.full_name?.split(" ") || []
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""
      setProfileData({
        firstName,
        lastName,
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        organization: profile.organization || "",
        bio: profile.bio || "School proprietor with 10 years of experience in education management.",
        dietaryRequirements: profile.dietary_requirements || "No specific requirements",
        emailNotifications: true,
        smsNotifications: false,
        schoolName: profile.school_name || "",
        schoolAddress: profile.school_address || "",
        schoolCity: profile.school_city || "",
        schoolState: profile.school_state || "",
        schoolType: profile.school_type || "",
        nappsPosition: profile.napps_position || "",
        nappsChapter: profile.napps_chapter || ""
      })
    }
  }, [profile, user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setProfileData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = async () => {
    try {
      // Email validation
      if (!profileData.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(profileData.email)) {
        toast.error("Please enter a valid email address")
        return
      }

      // Phone validation
      if (profileData.phone && !/^\d{10,11}$/.test(profileData.phone)) {
        toast.error("Phone number must be 10 or 11 digits")
        return
      }

      if (!profileData.firstName || !profileData.lastName) {
        toast.error("Please enter both first and last name")
        return
      }

      setIsSaving(true)
      const result = await updateProfile({
        fullName: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        organization: profileData.organization,
        position: profileData.nappsPosition,
        dietaryRequirements: profileData.dietaryRequirements,
        chapter: profileData.nappsChapter,
        state: profileData.schoolState,
        lga: profileData.schoolCity
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        window.location.reload()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="participant" title="Profile" />
      <div className="flex flex-1">
        <DashboardSidebar role="participant" />
        <div className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and preferences</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_250px]">
              <div className="space-y-6">
                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {loading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            value={profileData.firstName}
                            onChange={handleInputChange}
                            className="border-napps-gold/30 focus-visible:ring-napps-gold"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {loading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            value={profileData.lastName}
                            onChange={handleInputChange}
                            className="border-napps-gold/30 focus-visible:ring-napps-gold"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
                          title="Please enter a valid email address"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                          required
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="08012345678"
                          pattern="^\d{10,11}$"
                          title="Phone number must be 10 or 11 digits"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                          required
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {loading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder="Tell us about yourself"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          className="min-h-24 border-napps-gold/30 focus-visible:ring-napps-gold"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="dietaryRequirements"
                          name="dietaryRequirements"
                          placeholder="Any dietary requirements"
                          value={profileData.dietaryRequirements}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <School className="mr-2 h-5 w-5" />
                      School Information
                    </CardTitle>
                    <CardDescription>Update your school details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">School Name</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="schoolName"
                          name="schoolName"
                          placeholder="ABC International School"
                          value={profileData.schoolName}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolAddress">School Address</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="schoolAddress"
                          name="schoolAddress"
                          placeholder="123 Education Street"
                          value={profileData.schoolAddress}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schoolCity">City</Label>
                        {loading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            id="schoolCity"
                            name="schoolCity"
                            placeholder="Lagos"
                            value={profileData.schoolCity}
                            onChange={handleInputChange}
                            className="border-napps-gold/30 focus-visible:ring-napps-gold"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schoolState">State</Label>
                        {loading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select 
                            value={profileData.schoolState} 
                            onValueChange={(value) => handleSelectChange("schoolState", value)}
                          >
                            <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Abia">Abia</SelectItem>
                              <SelectItem value="Adamawa">Adamawa</SelectItem>
                              <SelectItem value="Akwa Ibom">Akwa Ibom</SelectItem>
                              <SelectItem value="Anambra">Anambra</SelectItem>
                              <SelectItem value="Bauchi">Bauchi</SelectItem>
                              <SelectItem value="Bayelsa">Bayelsa</SelectItem>
                              <SelectItem value="Benue">Benue</SelectItem>
                              <SelectItem value="Borno">Borno</SelectItem>
                              <SelectItem value="Cross River">Cross River</SelectItem>
                              <SelectItem value="Delta">Delta</SelectItem>
                              <SelectItem value="Ebonyi">Ebonyi</SelectItem>
                              <SelectItem value="Edo">Edo</SelectItem>
                              <SelectItem value="Ekiti">Ekiti</SelectItem>
                              <SelectItem value="Enugu">Enugu</SelectItem>
                              <SelectItem value="FCT">Federal Capital Territory</SelectItem>
                              <SelectItem value="Gombe">Gombe</SelectItem>
                              <SelectItem value="Imo">Imo</SelectItem>
                              <SelectItem value="Jigawa">Jigawa</SelectItem>
                              <SelectItem value="Kaduna">Kaduna</SelectItem>
                              <SelectItem value="Kano">Kano</SelectItem>
                              <SelectItem value="Katsina">Katsina</SelectItem>
                              <SelectItem value="Kebbi">Kebbi</SelectItem>
                              <SelectItem value="Kogi">Kogi</SelectItem>
                              <SelectItem value="Kwara">Kwara</SelectItem>
                              <SelectItem value="Lagos">Lagos</SelectItem>
                              <SelectItem value="Nasarawa">Nasarawa</SelectItem>
                              <SelectItem value="Niger">Niger</SelectItem>
                              <SelectItem value="Ogun">Ogun</SelectItem>
                              <SelectItem value="Ondo">Ondo</SelectItem>
                              <SelectItem value="Osun">Osun</SelectItem>
                              <SelectItem value="Oyo">Oyo</SelectItem>
                              <SelectItem value="Plateau">Plateau</SelectItem>
                              <SelectItem value="Rivers">Rivers</SelectItem>
                              <SelectItem value="Sokoto">Sokoto</SelectItem>
                              <SelectItem value="Taraba">Taraba</SelectItem>
                              <SelectItem value="Yobe">Yobe</SelectItem>
                              <SelectItem value="Zamfara">Zamfara</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolType">School Type</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select 
                          value={profileData.schoolType} 
                          onValueChange={(value) => handleSelectChange("schoolType", value)}
                        >
                          <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                            <SelectValue placeholder="Select school type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nursery">Nursery</SelectItem>
                            <SelectItem value="Primary">Primary</SelectItem>
                            <SelectItem value="Secondary">Secondary</SelectItem>
                            <SelectItem value="Nursery and Primary">Nursery and Primary</SelectItem>
                            <SelectItem value="Primary and Secondary">Primary and Secondary</SelectItem>
                            <SelectItem value="Nursery, Primary and Secondary">Nursery, Primary and Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      NAPPS Information
                    </CardTitle>
                    <CardDescription>Update your NAPPS details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nappsPosition">NAPPS Position</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select 
                          value={profileData.nappsPosition} 
                          onValueChange={(value) => handleSelectChange("nappsPosition", value)}
                        >
                          <SelectTrigger className="border-napps-gold/30 focus-visible:ring-napps-gold">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Member">Member</SelectItem>
                            <SelectItem value="Chairman">Chairman</SelectItem>
                            <SelectItem value="Vice Chairman">Vice Chairman</SelectItem>
                            <SelectItem value="Secretary">Secretary</SelectItem>
                            <SelectItem value="Treasurer">Treasurer</SelectItem>
                            <SelectItem value="Financial Secretary">Financial Secretary</SelectItem>
                            <SelectItem value="PRO">Public Relations Officer</SelectItem>
                            <SelectItem value="Welfare Officer">Welfare Officer</SelectItem>
                            <SelectItem value="Ex-Officio">Ex-Officio</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nappsChapter">NAPPS Chapter</Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          id="nappsChapter"
                          name="nappsChapter"
                          placeholder="e.g. Ikeja Chapter"
                          value={profileData.nappsChapter}
                          onChange={handleInputChange}
                          className="border-napps-gold/30 focus-visible:ring-napps-gold"
                        />
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="gold" 
                      className="shadow-gold"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={profileData.emailNotifications}
                        onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                        </div>
                      </div>
                      <Switch
                        checked={profileData.smsNotifications}
                        onCheckedChange={(checked) => handleSwitchChange("smsNotifications", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Manage your profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" alt="Profile" />
                      <AvatarFallback className="text-2xl">
                        {profileData.firstName.charAt(0)}
                        {profileData.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" className="w-full border-napps-gold/30">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Picture
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full border-napps-gold/30">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-napps-gold/30">
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Manage your payment details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full border-napps-gold/30">
                      <CreditCard className="mr-2 h-4 w-4" />
                      View Payment History
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
