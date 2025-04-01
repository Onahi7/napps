"use client"

import { cn } from "@/lib/utils"
import {
  BarChart,
  BookOpen,
  Calendar,
  CreditCard,
  Home,
  LogOut,
  QrCode,
  Settings,
  User,
  Users,
  FileText,
  Coffee,
  School,
  CheckSquare,
  BedDouble,
  Building,
  LayoutDashboard,
  CalendarClock,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"

interface DashboardSidebarProps {
  role: "admin" | "participant" | "validator"
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const adminMenuItems = [
    { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { href: "/admin/registrations", icon: Users, label: "Registrations" },
    { href: "/admin/payments", icon: CreditCard, label: "Payment Reviews" },
    { href: "/admin/validators", icon: QrCode, label: "Validators" },
    { href: "/admin/accreditation", icon: CheckSquare, label: "Accreditation" },
    { href: "/admin/schedule", icon: Calendar, label: "Schedule" },
    { href: "/admin/hotels", icon: Building, label: "Hotels" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
    { href: "/admin/assignments", icon: CalendarClock, label: "Assignments" },
  ]

  const participantMenuItems = [
    { href: "/participant/dashboard", icon: Home, label: "Dashboard" },
    { href: "/participant/profile", icon: User, label: "Profile" },
    { href: "/participant/qrcode", icon: QrCode, label: "QR Code" },
    { href: "/participant/resources", icon: BookOpen, label: "Resources" },
    { href: "/participant/schedule", icon: Calendar, label: "Schedule" },
    { href: "/participant/certificates", icon: FileText, label: "Certificates" },
  ]

  const validatorMenuItems = [
    { href: "/validator/dashboard", icon: Home, label: "Dashboard" },
    { href: "/validator/scan", icon: QrCode, label: "Scan QR" },
    { href: "/validator/accreditation", icon: CheckSquare, label: "Accreditation" },
    { href: "/validator/accommodation", icon: BedDouble, label: "Accommodation" },
  ]

  let menuItems = participantMenuItems

  if (role === "admin") {
    menuItems = adminMenuItems
  } else if (role === "validator") {
    menuItems = validatorMenuItems
  }

  return (
    <Sidebar className="border-r bg-background z-50" collapsible="offcanvas">
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <Link
          href={`/${role}/dashboard`}
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <School className="h-6 w-6 text-napps-gold" />
          <span className="text-napps-gold">NAPPS</span>
          <span className="text-sm font-normal text-muted-foreground hidden md:inline">Summit</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link 
                href={item.href} 
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  pathname === item.href 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator className="my-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <School className="h-4 w-4" />
          <span>NAPPS Summit 2025</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
