"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getConfigByKey, updateConfig } from "@/actions/config-actions"
import { formatCurrency } from "@/lib/config-service"

export default function SettingsPage() {
  const { toast } = useToast()
  const [registrationAmount, setRegistrationAmount] = useState<number>(20000)
  const [formattedAmount, setFormattedAmount] = useState<string>("₦20,000")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        const amount = await getConfigByKey("registrationAmount")
        if (amount !== null) {
          setRegistrationAmount(Number(amount))
          setFormattedAmount(formatCurrency(Number(amount)))
        }
      } catch (error) {
        console.error("Error fetching config:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [toast])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    const numericValue = value === "" ? 0 : Number.parseInt(value, 10)
    setRegistrationAmount(numericValue)
    setFormattedAmount(formatCurrency(numericValue))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update registration amount
      const result = await updateConfig("registrationAmount", registrationAmount)

      if (!result.success) {
        throw new Error(result.error || "Failed to update registration amount")
      }

      // Also update the formatted amount
      const formattedResult = await updateConfig("registrationAmountFormatted", formattedAmount)

      if (!formattedResult.success) {
        throw new Error(formattedResult.error || "Failed to update formatted amount")
      }

      toast({
        title: "Settings Saved",
        description: "Registration amount has been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Conference Settings</CardTitle>
          <CardDescription>Manage conference registration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationAmount">Registration Amount</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="registrationAmount"
                    type="text"
                    value={registrationAmount}
                    onChange={handleAmountChange}
                    className="font-mono"
                  />
                  <div className="w-40 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {formattedAmount}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Set the registration amount for conference participants</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

