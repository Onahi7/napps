"use client"

import { SidebarProvider } from "@/components/ui/sidebar"

export default function AdminLayout({
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