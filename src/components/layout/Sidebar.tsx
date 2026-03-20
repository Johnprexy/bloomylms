'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen, Award, Video, User,
  Users, BarChart2, DollarSign, Settings, GraduationCap,
  LogOut, UserPlus, BookMarked, Calendar,
  PlusCircle, Layers, X, FlaskConical, ClipboardList, Star, MessageSquare
} from 'lucide-react'

// Student nav — no "Browse Courses", focused on their content
const studentNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/my-courses', icon: BookMarked, label: 'My Courses' },
  { href: '/dashboard/labs', icon: FlaskConical, label: 'Labs & Resources' },
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
  { href: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
  { href: '/admin/gradebook', icon: Star, label: 'Gradebook' },
  { href: '/admin/surveys', icon: MessageSquare, label: 'Surveys & Polls' },
]

const superAdminNav = [
  { href: '/admin/settings', icon: Settings, label: 'System Settings' },
]

function NavItem({ href, icon: Icon, label, active, onClick }: any) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-bloomy-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function NavSection({ title, items, pathname, onNavigate }: any) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{title}</p>
      <div className="space-y-0.5">
        {items.map((item: any) => (
          <NavItem key={item.href} {...item}
            active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

export function openMobileSidebar() {
  window.dispatchEvent(new CustomEvent('open-sidebar'))
}

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = (session?.user as any)?.role as string
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin' || isSuperAdmin
  const isInstructor = role === 'instructor' || isAdmin
  const name = session?.user?.name || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const roleBadge = isSuperAdmin
    ? { label: 'Super Admin', color: 'bg-red-100 text-red-700' }
    : isAdmin ? { label: 'Admin', color: 'bg-purple-100 text-purple-700' }
    : role === 'instructor' ? { label: 'Instructor', color: 'bg-blue-100 text-blue-700' }
    : { label: 'Student', color: 'bg-green-100 text-green-700' }

  useEffect(() => {
    const handler = () => setMobileOpen(true)
    window.addEventListener('open-sidebar', handler)
    return () => window.removeEventListener('open-sidebar', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">BloomyLMS</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Bloomy Technologies</p>
          </div>
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="text-gray-400 hover:text-gray-600 p-1 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isAdmin && (
          <>
            <NavSection title="Admin" items={adminNav} pathname={pathname} onNavigate={onNavigate} />
            {isSuperAdmin && <NavSection title="Super Admin" items={superAdminNav} pathname={pathname} onNavigate={onNavigate} />}
            <NavSection title="Instructor" items={instructorNav} pathname={pathname} onNavigate={onNavigate} />
            <NavSection title="Student View" items={studentNav} pathname={pathname} onNavigate={onNavigate} />
          </>
        )}
        {!isAdmin && isInstructor && (
          <>
            <NavSection title="Teaching" items={instructorNav} pathname={pathname} onNavigate={onNavigate} />
          </>
        )}
        {!isInstructor && (
          <NavSection title="My Learning" items={studentNav} pathname={pathname} onNavigate={onNavigate} />
        )}
      </div>

      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge.color}`}>{roleBadge.label}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  )
}
