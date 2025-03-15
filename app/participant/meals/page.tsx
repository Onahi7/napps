"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Coffee, Utensils, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-hooks"
import { getMealValidations } from "@/actions/profile-actions"
import { getConferenceConfig } from "@/actions/config-actions";

interface MealStatus {
  status: "pending" | "validated" | "expired"
  time?: string
  validator?: string
}

interface DayMeals {
  breakfast: MealStatus
  dinner: MealStatus
}

interface MealData {
  [key: string]: DayMeals
}

export default function ParticipantMeals() {
  const { user } = useAuth()
  const [mealData, setMealData] = useState<MealData>({})
  const [mealTimes, setMealTimes] = useState({
    breakfast: "",
    dinner: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      
      try {
        const [validations, details] = await Promise.all([
          getMealValidations(user.id),
          getConferenceDetails()
        ])
        
        setMealData(validations)
        setMealTimes({
          breakfast: details.morning_hours || "7:00 AM - 9:00 AM",
          dinner: details.evening_hours || "6:00 PM - 8:00 PM"
        })
      } catch (error) {
        console.error('Error loading meal data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [user?.id])

  const days = Object.keys(mealData)
  const totalMeals = days.length * 2 // 2 meals per day
  const validatedMeals = Object.values(mealData).reduce((count, day) => {
    return count + (day.breakfast.status === "validated" ? 1 : 0) + (day.dinner.status === "validated" ? 1 : 0)
  }, 0)
  const progressPercentage = (validatedMeals / totalMeals) * 100

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "expired":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "validated":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Meal Status" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <p>Loading meal validations...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] bg-background">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Meal Status" />
        <main className="flex-1 p-6">
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMeals}</div>
                <p className="text-xs text-muted-foreground">Throughout the conference</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Meals Validated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validatedMeals}</div>
                <p className="text-xs text-muted-foreground">Successfully validated meals</p>
              </CardContent>
            </Card>

            <Card className="border-napps-green/20 dark:border-napps-green/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">
                    {validatedMeals}/{totalMeals}
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted" indicatorClassName="bg-napps-green" />
              </CardContent>
            </Card>
          </div>

          <Card className="border-napps-green/20 dark:border-napps-green/30 mb-6">
            <CardHeader>
              <CardTitle>Meal Validation Status</CardTitle>
              <CardDescription>Track your meal validations throughout the conference</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={days[0]} className="w-full">
                <TabsList className="bg-napps-green/10 dark:bg-napps-green/20 w-full justify-start mb-4">
                  {days.map((day) => (
                    <TabsTrigger
                      key={day}
                      value={day}
                      className="data-[state=active]:bg-napps-green data-[state=active]:text-white"
                    >
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {days.map((day) => (
                  <TabsContent key={day} value={day}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-napps-green/20 dark:border-napps-green/30 p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Coffee className="h-6 w-6 text-napps-green" />
                          <h3 className="text-lg font-bold">Breakfast</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(mealData[day]?.breakfast.status)}
                            <div>
                              <p className="font-medium">Status:</p>
                              <p>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(
                                    mealData[day]?.breakfast.status
                                  )}`}
                                >
                                  {mealData[day]?.breakfast.status.charAt(0).toUpperCase() +
                                    mealData[day]?.breakfast.status.slice(1)}
                                </span>
                              </p>
                            </div>
                          </div>

                          {mealData[day]?.breakfast.status === "validated" && (
                            <>
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Validation Time:</p>
                                  <p className="text-muted-foreground">
                                    {mealData[day]?.breakfast.time}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Utensils className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Validated By:</p>
                                  <p className="text-muted-foreground">
                                    {mealData[day]?.breakfast.validator}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                          {mealData[day]?.breakfast.status === "pending" && (
                            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 p-3 text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-300">Breakfast Time:</p>
                              <p className="text-yellow-700 dark:text-yellow-400">{mealTimes.breakfast}</p>
                              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                                Please present your QR code to a validator during breakfast time.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-md border border-napps-green/20 dark:border-napps-green/30 p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Utensils className="h-6 w-6 text-napps-green" />
                          <h3 className="text-lg font-bold">Dinner</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(mealData[day]?.dinner.status)}
                            <div>
                              <p className="font-medium">Status:</p>
                              <p>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(
                                    mealData[day]?.dinner.status
                                  )}`}
                                >
                                  {mealData[day]?.dinner.status.charAt(0).toUpperCase() +
                                    mealData[day]?.dinner.status.slice(1)}
                                </span>
                              </p>
                            </div>
                          </div>

                          {mealData[day]?.dinner.status === "validated" && (
                            <>
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Validation Time:</p>
                                  <p className="text-muted-foreground">{mealData[day]?.dinner.time}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Utensils className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Validated By:</p>
                                  <p className="text-muted-foreground">
                                    {mealData[day]?.dinner.validator}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                          {mealData[day]?.dinner.status === "pending" && (
                            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 p-3 text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-300">Dinner Time:</p>
                              <p className="text-yellow-700 dark:text-yellow-400">{mealTimes.dinner}</p>
                              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                                Please present your QR code to a validator during dinner time.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-napps-green/20 dark:border-napps-green/30">
            <CardHeader>
              <CardTitle>Meal Information</CardTitle>
              <CardDescription>Important details about conference meals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Meal Validation Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Present your QR code to a validator during meal times</li>
                    <li>The validator will scan your code to confirm your eligibility</li>
                    <li>Once validated, you can proceed to the dining area</li>
                    <li>Each meal can only be validated once</li>
                  </ol>
                </div>

                <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Meal Schedule</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-napps-green" />
                      <span>Breakfast: {mealTimes.breakfast}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-napps-green" />
                      <span>Dinner: {mealTimes.dinner}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-napps-green/10 dark:bg-napps-green/20 p-4">
                  <h3 className="font-medium mb-2">Dietary Requirements</h3>
                  <p className="text-muted-foreground">
                    If you have any dietary requirements or allergies, please inform the conference staff at the
                    registration desk.
                  </p>
                  <Button className="mt-3 bg-napps-green hover:bg-napps-green/90">Update Dietary Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

