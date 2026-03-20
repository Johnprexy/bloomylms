import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = token?.role as string
    const pathname = req.nextUrl.pathname

    const isSuperAdmin = role === 'super_admin'
    const isAdmin = role === 'admin' || isSuperAdmin
    const isInstructor = role === 'instructor' || isAdmin

    // Super admin only
    if (pathname.startsWith('/admin/settings') && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/analytics', req.url))
    }

    // Admin-only routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Instructor + admin routes
    if (pathname.startsWith('/instructor') && !isInstructor) {
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
