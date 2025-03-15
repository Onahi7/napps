"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, User } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import { getNotifications } from "@/actions/profile-actions"

interface Notification {
  id: string
  message: string
  time: string
  read: boolean
}

interface DashboardHeaderProps {
  role: "admin" | "participant" | "validator"
  title: string
  children?: React.ReactNode
}

export function DashboardHeader({ role, title, children }: DashboardHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const profileLink = `/${role}/profile`
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    async function loadNotifications() {
      try {
        const userNotifications = await getNotifications()
        setNotifications(userNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-napps-gold/30 bg-background px-4 sm:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-lg font-semibold gold-text">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative border-napps-gold/30 hover:border-napps-gold/50">
              <Bell className="h-5 w-5 text-napps-gold" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-napps-gold text-[10px] text-black font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-napps-gold/30">
            <DropdownMenuLabel className="text-napps-gold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-napps-gold/30" />
            {notifications.length === 0 ? (
              <DropdownMenuItem className="hover:bg-napps-gold/10">
                <div className="flex flex-col">
                  <span>No new notifications</span>
                </div>
              </DropdownMenuItem>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="hover:bg-napps-gold/10">
                  <div className="flex flex-col">
                    <span>{notification.message}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 ring-2 ring-napps-gold/30">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback className="bg-napps-gold text-black font-bold">
                  {role === "admin" ? "AD" : role === "validator" ? "VL" : "PT"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-napps-gold/30">
            <DropdownMenuLabel className="text-napps-gold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-napps-gold/30" />
            <DropdownMenuItem asChild className="hover:bg-napps-gold/10">
              <Link href={profileLink}>
                <User className="mr-2 h-4 w-4 text-napps-gold" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-napps-gold/10">
              <Link href="/login">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

