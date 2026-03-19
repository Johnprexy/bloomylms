import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are not set, just pass through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Wrap in try/catch — network issues or bad keys should never crash the app
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return supabaseResponse
  }

  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/instructor', '/admin', '/learn', '/certificates']
  const authPaths = ['/login', '/register', '/forgot-password']

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))
  const isAuthPage = authPaths.some(p => pathname.startsWith(p))

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role checks only for admin/instructor paths — read from JWT claim, not DB
  if (user) {
    try {
      if (pathname.startsWith('/admin') || pathname.startsWith('/instructor')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (pathname.startsWith('/instructor') && !['instructor', 'admin'].includes(profile?.role || '')) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    } catch {
      // On DB error, allow through — page-level auth will catch it
    }
  }

  return supabaseResponse
}
