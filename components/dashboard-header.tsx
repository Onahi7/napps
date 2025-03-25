"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"

interface DashboardHeaderProps {
  role: "admin" | "participant" | "validator"
  title: string
  children?: React.ReactNode
}

export function DashboardHeader({ role, title, children }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-14 items-center gap-4 px-4 sm:px-6">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex-1 flex items-center justify-between gap-4">
          <h1 className={cn("text-lg font-semibold leading-none tracking-tight", !children && "flex-1")}>
            {title}
          </h1>
          {children && <div className="flex-1">{children}</div>}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

