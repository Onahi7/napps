import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isValidatorPath = request.nextUrl.pathname.startsWith('/validator')
  const isLoginPath = request.nextUrl.pathname === '/validator/login'

  // If user is not logged in and trying to access validator pages
  if (!token && isValidatorPath && !isLoginPath) {
    return NextResponse.redirect(new URL('/validator/login', request.url))
  }

  // If user is logged in but not a validator
  if (token && isValidatorPath && token.role !== 'validator' && !isLoginPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If validator is logged in and trying to access login page
  if (token && token.role === 'validator' && isLoginPath) {
    return NextResponse.redirect(new URL('/validator/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/validator/:path*'
}