'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, Award, Video, Bell, User,
  Users, BarChart2, DollarSign, Settings, GraduationCap,
  LogOut, ChevronLeft, ChevronRight, Shield, UserPlus,
  BookMarked, Calendar, PlusCircle, Star, Layers
} from 'lucide-react'

const studentNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/courses', icon: BookOpen, label: 'Browse Courses' },
  { href: '/dashboard/my-courses', icon: BookMarked, label: 'My Courses' },
  { href: '/dashboard/live-sessions', icon: Video, label: 'Live Sessions' },
  { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

const instructorNav = [
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/courses/new', icon: PlusCircle, label: 'Create Course' },
  { href: '/instructor/students', icon: Users, label: 'My Students' },
  { href: '/instructor/analytics', icon: BarChart2, label: 'Analytics' },
]

const adminNav = [
  { href: '/admin/analytics', icon: BarChart2, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'All Users' },
  { href: '/admin/enroll', icon: UserPlus, label: 'Enroll Students' },
  { href: '/admin/instructors', icon: GraduationCap, label: 'Instructors' },
  { href: '/admin/courses', icon: BookOpen, label: 'All Courses' },
  { href: '/admin/course-builder', icon: Layers, label: 'Course Builder' },
  { href: '/admin/cohorts', icon: Calendar, label: 'Cohorts' },
  { href: '/admin/payments', icon: DollarSign, label: 'Payments' },
]

const superAdminNav = [
  { href: '/admin/settings', icon: Settings, label: 'System Settings' },
]

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-bloomy-600 text-white shadow-sm'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function NavSection({ title, items, pathname }: { title: string; items: any[]; pathname: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{title}</p>
      <div className="space-y-0.5">
        {items.map(item => (
          <NavItem key={item.href} {...item} active={pathname === item.href || (item.href !== '/dashboard' && item.href !== '/courses' && pathname.startsWith(item.href))} />
        ))}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const role = (session?.user as any)?.role as string
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin' || isSuperAdmin
  const isInstructor = role === 'instructor' || isAdmin
  const name = session?.user?.name || 'User'
  const email = session?.user?.email || ''
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const roleBadge = isSuperAdmin
    ? { label: 'Super Admin', color: 'bg-red-100 text-red-700 border border-red-200' }
    : isAdmin
    ? { label: 'Admin', color: 'bg-purple-100 text-purple-700 border border-purple-200' }
    : role === 'instructor'
    ? { label: 'Instructor', color: 'bg-blue-100 text-blue-700 border border-blue-200' }
    : { label: 'Student', color: 'bg-green-100 text-green-700 border border-green-200' }

  if (collapsed) return (
    <div className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-2 flex-shrink-0 h-screen sticky top-0">
      <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center mb-2">
        <span className="text-white font-bold text-xs">B</span>
      </div>
      <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 mt-auto">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">BloomyLMS</span>
        </Link>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-3">
        {isAdmin && (
          <>
            <NavSection title="Admin" items={adminNav} pathname={pathname} />
            {isSuperAdmin && <NavSection title="Super Admin" items={superAdminNav} pathname={pathname} />}
            <NavSection title="Instructor" items={instructorNav} pathname={pathname} />
            <NavSection title="Portal" items={studentNav} pathname={pathname} />
          </>
        )}
        {!isAdmin && isInstructor && (
          <>
            <NavSection title="Teaching" items={instructorNav} pathname={pathname} />
            <NavSection title="Portal" items={studentNav} pathname={pathname} />
          </>
        )}
        {!isInstructor && (
          <NavSection title="Learning" items={studentNav} pathname={pathname} />
        )}
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
