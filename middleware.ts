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
    const { data: { session }, error } = await supabase.auth.getSession()

    // Protected routes that require authentication
    const protectedRoutes = [
      "/participant",
      "/admin",
      "/validator",
      "/payment",
      "/profile",
    ]

    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )

    // Handle authentication
    if (isProtectedRoute) {
      if (!session) {
        // Special handling for admin routes - redirect to admin login
        if (request.nextUrl.pathname.startsWith("/admin")) {
          return NextResponse.redirect(new URL("/admin-login", request.url))
        }
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Role-based access control
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        const role = profile?.role || "participant"
        const path = request.nextUrl.pathname

        // Redirect users based on their role
        if (path.startsWith("/admin") && role !== "admin") {
          return NextResponse.redirect(new URL("/participant/dashboard", request.url))
        }
        if (path.startsWith("/validator") && role !== "validator") {
          return NextResponse.redirect(new URL("/participant/dashboard", request.url))
        }
      }
    }

    // Handle authentication routes when already logged in
    const authRoutes = ["/login", "/register", "/pre-register"]
    if (authRoutes.includes(request.nextUrl.pathname) && session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      const role = profile?.role || "participant"
      switch (role) {
        case "admin":
          return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        case "validator":
          return NextResponse.redirect(new URL("/validator/dashboard", request.url))
        default:
          return NextResponse.redirect(new URL("/participant/dashboard", request.url))
      }
    }

    return response
  } catch (error) {
    // Log error in production without exposing details
    console.error("Middleware error:", error)
    
    // Return graceful error response
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
