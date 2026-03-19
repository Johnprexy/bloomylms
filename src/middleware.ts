import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin-only routes
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Instructor + admin routes
    if (pathname.startsWith('/instructor') && !['instructor', 'admin'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname
        const protectedPaths = ['/dashboard', '/instructor', '/admin', '/learn', '/certificates', '/onboarding']
        const isProtected = protectedPaths.some(p => pathname.startsWith(p))
        if (isProtected) return !!token
        return true
      },
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/learn/:path*',
    '/certificates/:path*',
    '/onboarding/:path*',
  ],
}
