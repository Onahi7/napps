"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, QrCode, Camera, Phone, User, Search } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-hooks"

export default function ValidatorScan() {
  const { user } = useAuth()
  const [scanActive, setScanActive] = useState(false)
  const [validationType, setValidationType] = useState("breakfast")
  const [scanResult, setScanResult] = useState<null | { success: boolean; message: string; participant?: any }>(null)
  const [manualPhone, setManualPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("scan")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Mock function to simulate QR code scanning
  const startScanning = () => {
    setScanActive(true)
    // In a real app, you would initialize the camera and QR scanner here
    // For this mock, we'll just simulate a successful scan after 3 seconds
    setTimeout(() => {
      const mockParticipant = {
        id: "123456",
        full_name: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        school: "ABC International School",
        status: "accredited",
        validations: {
          breakfast: true,
          lunch: false,
          dinner: false,
          accreditation: true,
        },
      }

      // Simulate different validation scenarios
      if (validationType === "breakfast" && mockParticipant.validations.breakfast) {
        setScanResult({
          success: false,
          message: "Participant has already been validated for breakfast",
          participant: mockParticipant,
        })
      } else if (validationType === "lunch" && mockParticipant.validations.lunch) {
        setScanResult({
          success: false,
          message: "Participant has already been validated for lunch",
          participant: mockParticipant,
        })
      } else if (validationType === "dinner" && mockParticipant.validations.dinner) {
        setScanResult({
          success: false,
          message: "Participant has already been validated for dinner",
          participant: mockParticipant,
        })
      } else if (validationType === "accreditation" && mockParticipant.validations.accreditation) {
        setScanResult({
          success: false,
          message: "Participant has already been accredited",
          participant: mockParticipant,
        })
      } else {
        setScanResult({
          success: true,
          message: `Successfully validated participant for ${validationType}`,
          participant: mockParticipant,
        })
      }

      setScanActive(false)
    }, 3000)
  }

  const stopScanning = () => {
    setScanActive(false)
    // In a real app, you would stop the camera and QR scanner here
  }

  // Mock function to simulate manual validation
  const handleManualValidation = () => {
    if (!manualPhone) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const mockParticipant = {
        id: "123456",
        full_name: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        school: "ABC International School",
        status: "accredited",
        validations: {
          breakfast: false,
          lunch: false,
          dinner: false,
          accreditation: true,
        },
      }

      // Check if phone matches our mock data
      if (manualPhone === mockParticipant.phone || manualPhone === "08012345678") {
        setScanResult({
          success: true,
          message: `Successfully validated participant for ${validationType}`,
          participant: mockParticipant,
        })
      } else {
        setScanResult({
          success: false,
          message: "Participant not found",
          participant: null,
        })
      }

      setIsLoading(false)
    }, 1500)
  }

  const handleValidate = () => {
    if (!scanResult?.participant) return

    setIsLoading(true)

    // Simulate API call to update validation status
    setTimeout(() => {
      toast({
        title: "Success",
        description: `Participant validated for ${validationType}`,
      })

      // Update the scan result to reflect the new validation status
      const updatedParticipant = { ...scanResult.participant }
      updatedParticipant.validations[validationType as keyof typeof updatedParticipant.validations] = true

      setScanResult({
        success: true,
        message: `Successfully validated participant for ${validationType}`,
        participant: updatedParticipant,
      })

      setIsLoading(false)
    }, 1000)
  }

  const handleReset = () => {
    setScanResult(null)
    setManualPhone("")
    stopScanning()
  }

  useEffect(() => {
    // Reset scan result when changing validation type
    setScanResult(null)
    setManualPhone("")
  }, [validationType])

  useEffect(() => {
    // Reset scan result when changing tabs
    setScanResult(null)
    setManualPhone("")
    stopScanning()
  }, [activeTab])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role="validator" />
      <div className="flex flex-col">
        <DashboardHeader heading="Scan QR Code" text="Validate participants for meals and accreditation">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Validator: {user?.name}</span>
          </div>
        </DashboardHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card className="border-napps-gold/30 card-glow">
            <CardHeader>
              <CardTitle>Validation Type</CardTitle>
              <CardDescription>Select what you are validating the participant for</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={validationType}
                onValueChange={setValidationType}
                className="grid grid-cols-2 gap-4 md:grid-cols-4"
              >
                <div>
                  <RadioGroupItem value="breakfast" id="breakfast" className="peer sr-only" />
                  <Label
                    htmlFor="breakfast"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-napps-gold [&:has([data-state=checked])]:border-napps-gold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-3 h-6 w-6"
                    >
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                      <line x1="6" y1="1" x2="6" y2="4"></line>
                      <line x1="10" y1="1" x2="10" y2="4"></line>
                      <line x1="14" y1="1" x2="14" y2="4"></line>
                    </svg>
                    Breakfast
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="lunch" id="lunch" className="peer sr-only" />
                  <Label
                    htmlFor="lunch"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-napps-gold [&:has([data-state=checked])]:border-napps-gold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-3 h-6 w-6"
                    >
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                      <path d="M7 2v20"></path>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                    </svg>
                    Lunch
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dinner" id="dinner" className="peer sr-only" />
                  <Label
                    htmlFor="dinner"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-napps-gold [&:has([data-state=checked])]:border-napps-gold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-3 h-6 w-6"
                    >
                      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                      <path d="M7 2v20"></path>
                      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                    </svg>
                    Dinner
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="accreditation" id="accreditation" className="peer sr-only" />
                  <Label
                    htmlFor="accreditation"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-napps-gold [&:has([data-state=checked])]:border-napps-gold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-3 h-6 w-6"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Accreditation
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="border-napps-gold/30">
            <CardHeader>
              <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="scan" className="mt-0">
                <div className="flex flex-col items-center space-y-4">
                  {!scanResult && (
                    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                      {scanActive ? (
                        <>
                          <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            autoPlay
                            playsInline
                            muted
                          ></video>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-48 w-48 animate-pulse rounded-lg border-4 border-dashed border-napps-gold"></div>
                          </div>
                          <canvas ref={canvasRef} className="hidden"></canvas>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <QrCode className="mb-4 h-16 w-16 text-muted-foreground" />
                          <p className="text-center text-sm text-muted-foreground">
                            Click the button below to start scanning
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {scanResult && (
                    <div
                      className={`w-full rounded-lg border p-4 ${
                        scanResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scanResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <p className="font-medium">{scanResult.message}</p>
                      </div>

                      {scanResult.participant && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{scanResult.participant.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{scanResult.participant.phone}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {scanResult.participant.school}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!scanResult ? (
                    <Button
                      onClick={scanActive ? stopScanning : startScanning}
                      className={
                        scanActive
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-napps-gold text-black hover:bg-napps-gold/90"
                      }
                    >
                      {scanActive ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Stop Scanning
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Start Scanning
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      {scanResult.success && scanResult.participant && (
                        <Button
                          onClick={handleValidate}
                          className="bg-green-500 hover:bg-green-600"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm Validation
                            </>
                          )}
                        </Button>
                      )}
                      <Button onClick={handleReset} variant="outline">
                        Scan Another
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-0">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        placeholder="Enter participant's phone number"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleManualValidation}
                        className="bg-napps-gold text-black hover:bg-napps-gold/90"
                        disabled={isLoading || !manualPhone}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4 animate-spin"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Searching...
                          </span>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {scanResult && (
                    <div
                      className={`rounded-lg border p-4 ${
                        scanResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scanResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <p className="font-medium">{scanResult.message}</p>
                      </div>

                      {scanResult.participant && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{scanResult.participant.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{scanResult.participant.phone}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {scanResult.participant.school}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {scanResult.success && scanResult.participant && (
                          <Button
                            onClick={handleValidate}
                            className="bg-green-500 hover:bg-green-600"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-4 w-4 animate-spin"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Validation
                              </>
                            )}
                          </Button>
                        )}
                        <Button onClick={handleReset} variant="outline">
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
