import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { getToken } from 'next-auth/jwt'
import { getSystemConfig } from '@/actions/config-actions'

// List of paths that should be publicly accessible without authentication
const publicPaths = [
  '/', // Homepage
  '/login',
  '/register',
  '/pre-register',
  '/terms',
  '/privacy',
  '/offline',
  '/registration-success', // Explicitly public
  // Add other public paths here if needed
];

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    
    // --- Check for Next.js internals, static files, and API routes first ---
    // These often don't need the same auth checks or might have their own.
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') || // Allow API routes; specific API routes can add their own auth checks
      pathname.startsWith('/static') ||
      pathname.includes('.') // Assume paths with extensions are static files (e.g., favicon.ico)
    ) {
      return NextResponse.next()
    }

    // --- Check if the path is in our explicit public list ---
    if (publicPaths.includes(pathname)) {
      return NextResponse.next() // Allow access immediately
    }

    // --- If NOT a public path, THEN check authentication ---
    // getToken will return null if the user is not authenticated
    const token = await getToken({ req })

    // If no token exists (user not authenticated), redirect to login
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname)) // Remember where the user was trying to go
      return NextResponse.redirect(url)
    }

    // --- If authenticated, proceed with role-based routing ---
    const userRole = token.role as string

    // Handle dashboard access redirection based on role
    if (pathname === '/dashboard') { // Generic dashboard path
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (userRole === 'VALIDATOR') {
        return NextResponse.redirect(new URL('/validator/dashboard', req.url))
      } else if (userRole === 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/participant/dashboard', req.url))
      }
      // If role is somehow unknown but token exists, maybe redirect to login or a generic error page?
      // For now, let's allow them to stay at /dashboard, though it might be empty.
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url)) // Redirect non-admins away
    }

    // Protect validator routes
    if (pathname.startsWith('/validator') && userRole !== 'VALIDATOR') {
      return NextResponse.redirect(new URL('/dashboard', req.url)) // Redirect non-validators away
    }

    // Protect participant routes
    if (pathname.startsWith('/participant') && userRole !== 'PARTICIPANT') {
      return NextResponse.redirect(new URL('/dashboard', req.url)) // Redirect non-participants away
    }

    // If authenticated and role checks pass (or don't apply to the specific path),
    // allow the request to proceed.
    return NextResponse.next()
  },
  {
    callbacks: {
      // We handle unauthenticated access explicitly by checking publicPaths first
      // and then checking for a token. So, we tell withAuth to always run the middleware function.
      authorized: () => true, 
    },
  }
)

// The matcher determines which paths will invoke the middleware function.
export const config = {
  matcher: [
    // Apply middleware to all paths except:
    // - /api routes (handled explicitly inside middleware if needed)
    // - /_next/static (static files)
    // - /_next/image (image optimization files)
    // - /static (public static files)
    // - Files with extensions (e.g., favicon.ico, robots.txt)
    '/((?!api|_next/static|_next/image|static|.*\\.[\\w]+$).*)',
  ],
}
