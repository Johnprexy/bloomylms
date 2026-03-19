import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, DollarSign, TrendingUp, Award, Activity } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import AdminCharts from '@/components/admin/AdminCharts'

export const metadata = { title: 'Admin Analytics' }

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: totalStudents },
    { count: totalInstructors },
    { count: totalCourses },
    { count: activeEnrollments },
    { count: totalCerts },
    { data: payments },
    { data: recentEnrollments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
    supabase.from('payments').select('amount, created_at').eq('status', 'success'),
    supabase.from('enrollments').select(`enrolled_at, course:courses(title)`).order('enrolled_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('full_name, email, role, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const totalRevenue = payments?.reduce((s, p) => s + p.amount, 0) || 0

  // Build monthly revenue data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('default', { month: 'short' })
    const revenue = payments?.filter(p => {
      const pd = new Date(p.created_at)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
    }).reduce((s, p) => s + p.amount, 0) || 0
    return { month, revenue }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">BloomyLMS platform overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Students', value: totalStudents || 0, icon: Users, color: 'bg-blue-50 text-blue-600', sub: 'total enrolled' },
          { label: 'Instructors', value: totalInstructors || 0, icon: Activity, color: 'bg-purple-50 text-purple-600', sub: 'active' },
          { label: 'Courses', value: totalCourses || 0, icon: BookOpen, color: 'bg-green-50 text-green-600', sub: 'published' },
          { label: 'Enrollments', value: activeEnrollments || 0, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600', sub: 'active' },
          { label: 'Certificates', value: totalCerts || 0, icon: Award, color: 'bg-orange-50 text-orange-600', sub: 'issued' },
          { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', sub: 'total' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
            <p className="text-xs font-medium text-gray-700 mt-1">{stat.label}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts monthlyData={monthlyData} />

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent enrollments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Enrollments</h2>
          </div>
          <div>
            {recentEnrollments?.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{(e.course as any)?.title}</p>
                  <p className="text-xs text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Sign-ups</h2>
          </div>
          <div>
            {recentUsers?.map((u, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.role === 'admin' ? 'bg-red-50 text-red-700' :
                  u.role === 'instructor' ? 'bg-purple-50 text-purple-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
