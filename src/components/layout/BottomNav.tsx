'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LayoutDashboard, BookOpen, BookMarked, Award, User, BarChart2, Users, UserPlus, Layers } from 'lucide-react'

export default function BottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role as string
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isInstructor = role === 'instructor' || isAdmin

  const studentTabs = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/courses', icon: BookOpen, label: 'Courses' },
    { href: '/dashboard/my-courses', icon: BookMarked, label: 'My Courses' },
    { href: '/dashboard/certificates', icon: Award, label: 'Certs' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]

  const instructorTabs = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/instructor/courses', icon: BookOpen, label: 'Courses' },
    { href: '/instructor/students', icon: Users, label: 'Students' },
    { href: '/instructor/analytics', icon: BarChart2, label: 'Analytics' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]

  const adminTabs = [
    { href: '/admin/analytics', icon: BarChart2, label: 'Overview' },
    { href: '/admin/enroll', icon: UserPlus, label: 'Enroll' },
    { href: '/admin/course-builder', icon: Layers, label: 'Builder' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]

  const tabs = isAdmin ? adminTabs : isInstructor ? instructorTabs : studentTabs

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && tab.href !== '/courses' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-bloomy-600' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bloomy-gradient rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
