"use client"

import { SidebarProvider } from "@/components/ui/sidebar"

export default function ValidatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  )
}