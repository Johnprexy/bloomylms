'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, DollarSign, Settings, UserCheck, Calendar, GraduationCap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/analytics', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/instructors', label: 'Instructors', icon: GraduationCap },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/cohorts', label: 'Cohorts', icon: Calendar },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const path = usePathname()
  return (
    <nav className="space-y-1">
      {links.map(l => (
        <Link key={l.href} href={l.href} className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          path.startsWith(l.href) ? 'bg-bloomy-50 text-bloomy-700' : 'text-gray-600 hover:bg-gray-50'
        )}>
          <l.icon className="w-4 h-4 flex-shrink-0" />
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
