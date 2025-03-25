"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Share2, QrCode, Phone, CheckSquare, Coffee } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSession, signIn } from 'next-auth/react'
import QRCode from 'qrcode'

export default function ParticipantQRCode() {
  const { data: session, status } = useSession()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState("qrcode")

  useEffect(() => {
    const generateQRCode = async () => {
      if (!session?.user) return
      
      const canvas = qrCanvasRef.current
      if (!canvas) return

      // Generate QR code with participant details
      const participantData = {
        id: session.user.id,
        name: session.user.full_name,
        phone: session.user.phone,
        type: "participant"
      }

      try {
        await QRCode.toCanvas(canvas, JSON.stringify(participantData), {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })

        // Add NAPPS text below QR code
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.font = "bold 16px Arial"
          ctx.fillStyle = "black"
          ctx.textAlign = "center"
          ctx.fillText("NAPPS CONFERENCE 2025", canvas.width / 2, canvas.height - 10)
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQRCode()
  }, [session])

  const handleDownload = () => {
    const canvas = qrCanvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = "napps-conference-qrcode.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!session) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="My Identification" />
        <main className="flex-1 p-6">
          <Card className="mx-auto max-w-md border-napps-green/20 dark:border-napps-green/30 card-glow">
            <CardHeader className="text-center">
              <CardTitle>Your Conference Identification</CardTitle>
              <CardDescription>Use this for accreditation and meal validation</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="qrcode" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full">
                  <TabsTrigger
                    value="qrcode"
                    className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="phone"
                    className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Phone Number
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qrcode">
                  <div className="rounded-lg border p-4 bg-white">
                    <canvas ref={qrCanvasRef} width={300} height={300} className="mx-auto" />
                  </div>
                </TabsContent>

                <TabsContent value="phone">
                  <div className="rounded-lg border p-8 bg-napps-green/10 text-center">
                    <Phone className="h-12 w-12 text-napps-green mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Your Registered Phone</h3>
                    <p className="text-3xl font-bold text-napps-green mb-2">{session.user.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      Show this number to validators for accreditation and meal validation
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              {activeTab === "qrcode" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="border-napps-green/30 text-napps-green hover:bg-napps-green/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button className="bg-napps-green hover:bg-napps-green/90">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </>
              ) : (
                <Button className="w-full bg-napps-green hover:bg-napps-green/90">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Phone Number
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="mx-auto max-w-md mt-6 border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <CardTitle>Identification Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Name:</div>
                <div className="text-sm">{session.user.full_name}</div>

                <div className="text-sm font-medium">Ticket Type:</div>
                <div className="text-sm">Regular</div>

                <div className="text-sm font-medium">Status:</div>
                <div className="text-sm">
                  <span className="inline-flex items-center rounded-full bg-napps-green/20 px-2.5 py-0.5 text-xs font-medium text-napps-green">
                    Active
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-napps-green/10 p-4 text-sm">
                <p className="font-medium mb-2">Use your identification for:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-napps-green" />
                    <span>Conference Accreditation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-napps-green" />
                    <span>Breakfast Validation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-napps-green" />
                    <span>Dinner Validation</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}