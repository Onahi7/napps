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
import { useAuth } from "@/components/auth-provider"
import jsQR from 'jsqr'

export default function ValidatorScan() {
  const { user } = useAuth()
  const [scanActive, setScanActive] = useState(false)
  const [validationType] = useState<string>("accreditation")
  const [scanResult, setScanResult] = useState<null | { success: boolean; message: string; participant?: any }>(null)
  const [manualPhone, setManualPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("scan")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const { toast } = useToast()

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setScanActive(true)
        
        // Start QR code scanning loop
        scanIntervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')
            if (!context) return

            // Set canvas size to match video
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            
            // Draw current video frame to canvas
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            
            // Get image data for QR code scanning
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            
            if (code) {
              try {
                const qrData = JSON.parse(code.data)
                if (qrData.id && qrData.type === 'participant') {
                  handleValidation(qrData.id)
                  stopScanning()
                }
              } catch (e) {
                console.error('Invalid QR code data:', e)
              }
            }
          }
        }, 500) // Scan every 500ms
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Error",
        description: "Could not access camera",
        variant: "destructive"
      })
    }
  }

  const stopScanning = () => {
    setScanActive(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleValidation = async (participantId?: string) => {
    if (!participantId && !manualPhone) {
      toast({
        title: "Error",
        description: "Please enter a phone number or scan a QR code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/validator/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          phone: manualPhone,
          validationType,
          location: 'Main Hall' // TODO: Make this dynamic
        })
      })

      const data = await response.json()
      setScanResult({
        success: data.success,
        message: data.message,
        participant: data.participant
      })

      if (data.success) {
        toast({
          title: "Success",
          description: "Participant validated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error validating:', error)
      toast({
        title: "Error",
        description: "Failed to validate participant",
        variant: "destructive"
      })
      setScanResult({
        success: false,
        message: "Failed to validate participant"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualValidation = () => handleValidation()
  
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
        <DashboardHeader title="Scan QR Code" role="validator">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Validator: {user?.name}</span>
          </div>
        </DashboardHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card className="border-napps-gold/30 card-glow">
            <CardHeader>
              <CardTitle>Validation Process</CardTitle>
              <CardDescription>Scan participant QR codes to validate their accreditation</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scan" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="scan">
                    <QrCode className="mr-2 h-4 w-4" />
                    Scan QR Code
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <Phone className="mr-2 h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scan" className="mt-4">
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
                            onClick={() => handleValidation(scanResult?.participant?.id)}
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
                              onClick={() => handleValidation(scanResult?.participant?.id)}
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
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
