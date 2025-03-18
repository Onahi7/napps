"use client"

import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface DashboardLayoutProps {
  children: ReactNode
  role: "admin" | "participant" | "validator"
  title: string
}

export function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <DashboardSidebar role={role} />
      <div className="flex flex-col w-full">
        <DashboardHeader role={role} title={title} />
        <main className="flex-1 p-4 md:p-6 w-full">{children}</main>
      </div>
    </div>
  )
}

