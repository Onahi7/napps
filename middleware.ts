import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { getToken } from 'next-auth/jwt'
import { getSystemConfig } from '@/actions/config-actions'

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const { pathname } = req.nextUrl
    
    // Allow public routes and API routes
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

    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(url)
    }

    // Role-based routing
    const userRole = token.role as string

    // Handle dashboard access
    if (pathname === '/dashboard' || pathname === '/participant/dashboard') {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (userRole === 'VALIDATOR') {
        return NextResponse.redirect(new URL('/validator/dashboard', req.url))
      } else if (userRole === 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/participant/dashboard', req.url))
      }
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protect validator routes
    if (pathname.startsWith('/validator') && userRole !== 'VALIDATOR') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protect participant routes
    if (pathname.startsWith('/participant') && userRole !== 'PARTICIPANT') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)'
  ]
}
