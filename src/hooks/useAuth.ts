'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    profile: session?.user ? {
      id: (session.user as any).id,
      email: session.user.email,
      full_name: session.user.name,
      avatar_url: session.user.image,
      role: (session.user as any).role || 'student',
    } : null,
    loading: status === 'loading',
    isAuthenticated: !!session?.user,
  }
}
