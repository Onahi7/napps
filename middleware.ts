import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: "",
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()
    
    const path = request.nextUrl.pathname
    
    // Define route groups for cleaner access control
    const isAdminRoute = path.startsWith("/admin")
    const isValidatorRoute = path.startsWith("/validator")
    const isParticipantRoute = path.startsWith("/participant")
    const isPaymentRoute = path.startsWith("/payment") || path.startsWith("/profile")
    const isAuthRoute = path === "/login" || path === "/register" || path === "/pre-register" || path === "/admin-login"
    
    // Skip middleware for public assets
    if (
      path.startsWith("/_next") || 
      path.startsWith("/favicon.ico") ||
      path.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/)
    ) {
      return response
    }
    
    // If user is already logged in and trying to access auth routes, redirect to appropriate dashboard
    if (session && isAuthRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      const role = profile?.role || "participant"
      
      // Redirect based on user role
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      } else if (role === "validator") {
        return NextResponse.redirect(new URL("/validator/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/participant/dashboard", request.url))
      }
    }
    
    // Handle protected routes access
    if (!session) {
      // Not logged in, trying to access protected routes
      if (isAdminRoute) {
        // Special case for admin routes
        return NextResponse.redirect(new URL("/admin-login", request.url))
      } else if (isValidatorRoute || isParticipantRoute || isPaymentRoute) {
        // Other protected routes
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } else {
      // Logged in, check role-based access
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        
      const role = profile?.role || "participant"
      
      // Role-based access control with simpler logic
      if (isAdminRoute && role !== "admin") {
        return NextResponse.redirect(new URL("/participant/dashboard", request.url))
      }
      
      if (isValidatorRoute && role !== "validator" && role !== "admin") {
        return NextResponse.redirect(new URL("/participant/dashboard", request.url))
      }
    }
    
    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "An error occurred processing your request",
      }),
      { 
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      }
    )
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
