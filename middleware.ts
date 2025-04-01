import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { getToken } from 'next-auth/jwt'

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token

    // Get pathname
    const { pathname } = req.nextUrl

    // If user is not logged in
    if (!isAuth) {
      // Public pages that don't require authentication
      if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/pre-register' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname === '/offline' ||
        pathname === '/registration-success' ||
        pathname.startsWith('/static')
      ) {
        return NextResponse.next()
      }

      // Redirect to login for protected pages
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based access control
    const userRole = token.role as string

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Validator routes
    if (pathname.startsWith('/validator')) {
      if (userRole !== 'VALIDATOR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Participant routes
    if (pathname.startsWith('/participant')) {
      if (userRole !== 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Dashboard redirect based on role
    if (pathname === '/dashboard') {
      switch (userRole) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        case 'VALIDATOR':
          return NextResponse.redirect(new URL('/validator/dashboard', req.url))
        case 'PARTICIPANT':
          return NextResponse.redirect(new URL('/participant/dashboard', req.url))
        default:
          return NextResponse.redirect(new URL('/', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

// Protect all routes except these
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. All public files in /public
     * 2. All API routes (/api/.*)
     * 3. All Next.js files (/_next/.*)
     * 4. Static files (/static/.*) 
     */
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)'
  ]
}
