import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const path = request.nextUrl.pathname

  // Allow public paths
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/static') ||
    path === '/login' ||
    path === '/admin-login' ||
    path === '/pre-register' ||
    path === '/register' ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Handle authenticated users trying to access the homepage
  if (path === '/' && token) {
    const role = token.role as string
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else if (role === 'validator') {
      return NextResponse.redirect(new URL('/validator/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/participant/dashboard', request.url))
    }
  }

  // For all other routes, let NextAuth handle the auth
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
