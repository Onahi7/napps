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

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    const path = request.nextUrl.pathname
    
    // Define route categories
    const isAdminRoute = path.startsWith("/admin")
    const isValidatorRoute = path.startsWith("/validator")
    const isProtectedRoute = path.startsWith("/participant") || 
                             path.startsWith("/payment") ||
                             path.startsWith("/profile")
    const isPublicRoute = path === "/" || 
                          path === "/login" || 
                          path === "/register" || 
                          path === "/pre-register" || 
                          path === "/admin-login" ||
                          path.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/) ||
                          path.startsWith("/_next") || 
                          path.startsWith("/favicon.ico")
    
    // Skip middleware for public assets
    if (path.startsWith("/_next") || path.startsWith("/favicon.ico") || path.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/)) {
      return response
    }
    
    // Simplified authentication logic
    if (!session) {
      // Not logged in, allow access only to public routes
      if (isAdminRoute) {
        return NextResponse.redirect(new URL("/admin-login", request.url))
      } else if (isValidatorRoute || isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } else {
      // Logged in
      // Check role only for admin and validator routes
      if (isAdminRoute || isValidatorRoute) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        
        const role = profile?.role || "participant"
        
        // Admin routes require admin role
        if (isAdminRoute && role !== "admin") {
          return NextResponse.redirect(new URL("/participant/dashboard", request.url))
        }
        
        // Validator routes require validator or admin role
        if (isValidatorRoute && role !== "validator" && role !== "admin") {
          return NextResponse.redirect(new URL("/participant/dashboard", request.url))
        }
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
