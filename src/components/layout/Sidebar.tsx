'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, GraduationCap, Award, User, LogOut, ChevronLeft, ChevronRight, Bell, Settings, Users, BarChart3, DollarSign, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

const studentNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/courses', icon: BookOpen, label: 'All Courses' },
  { href: '/dashboard/my-courses', icon: GraduationCap, label: 'My Courses' },
  { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

const instructorNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/courses/new', icon: PlusCircle, label: 'New Course' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
  { href: '/instructor/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

const adminNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { href: '/admin/payments', icon: DollarSign, label: 'Payments' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const nav = profile.role === 'admin' ? adminNav : profile.role === 'instructor' ? instructorNav : studentNav

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={cn(
      'bg-white border-r border-gray-100 flex flex-col transition-all duration-300 relative',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        {!collapsed && <span className="font-bold text-gray-900 text-sm">BloomyLMS</span>}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-50">
          <span className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            profile.role === 'admin' ? 'bg-red-50 text-red-700' :
            profile.role === 'instructor' ? 'bg-purple-50 text-purple-700' :
            'bg-green-50 text-green-700'
          )}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={cn(
              'sidebar-link',
              active && 'active',
              collapsed && 'justify-center px-2'
            )} title={collapsed ? label : undefined}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profile + signout */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(profile.full_name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut} className={cn('sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600', collapsed && 'justify-center px-2')} title={collapsed ? 'Sign out' : undefined}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>
    </aside>
  )
}
