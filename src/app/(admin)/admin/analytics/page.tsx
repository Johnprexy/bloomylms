import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { Users, BookOpen, DollarSign, TrendingUp, Award, Activity } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

import AdminCharts from '@/components/admin/AdminCharts'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Admin Analytics' }

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const [students, instructors, courses, activeEnrollments, certs, payments, recentEnrollments, recentUsers] = await Promise.all([
    sql`SELECT COUNT(*) as n FROM users WHERE role = 'student'`,
    sql`SELECT COUNT(*) as n FROM users WHERE role = 'instructor'`,
    sql`SELECT COUNT(*) as n FROM courses WHERE status = 'published'`,
    sql`SELECT COUNT(*) as n FROM enrollments WHERE status = 'active'`,
    sql`SELECT COUNT(*) as n FROM certificates WHERE status = 'issued'`,
    sql`SELECT amount, created_at FROM payments WHERE status = 'success'`,
    sql`SELECT e.enrolled_at, c.title FROM enrollments e JOIN courses c ON e.course_id = c.id ORDER BY e.enrolled_at DESC LIMIT 10`,
    sql`SELECT full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 8`,
  ])

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('default', { month: 'short' })
    const revenue = payments.filter((p: any) => { const pd = new Date(p.created_at); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() }).reduce((s: number, p: any) => s + Number(p.amount), 0)
    return { month, revenue }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1><p className="text-sm text-gray-500">BloomyLMS platform overview</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Students', value: Number(students[0].n), icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Instructors', value: Number(instructors[0].n), icon: Activity, color: 'bg-purple-50 text-purple-600' },
          { label: 'Courses', value: Number(courses[0].n), icon: BookOpen, color: 'bg-green-50 text-green-600' },
          { label: 'Enrollments', value: Number(activeEnrollments[0].n), icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Certificates', value: Number(certs[0].n), icon: Award, color: 'bg-orange-50 text-orange-600' },
          { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center mb-3`}><stat.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-700 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <AdminCharts monthlyData={monthlyData} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900 text-sm">Recent Enrollments</h2></div>
          {recentEnrollments.map((e: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
              <div><p className="text-sm font-medium text-gray-900 truncate">{e.title}</p><p className="text-xs text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</p></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900 text-sm">Recent Sign-ups</h2></div>
          {recentUsers.map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">{u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900">{u.full_name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-50 text-red-700' : u.role === 'instructor' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
