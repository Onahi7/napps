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
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role={role} />
      <div className="flex flex-col w-full overflow-x-hidden">
        <DashboardHeader role={role} title={title} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[100vw]">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

