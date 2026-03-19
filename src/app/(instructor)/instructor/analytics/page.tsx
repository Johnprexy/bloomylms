import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart2, Users, DollarSign, Star, TrendingUp, BookOpen } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import InstructorRevenueChart from '@/components/instructor/InstructorRevenueChart'

export const metadata = { title: 'Analytics — Instructor' }

export default async function InstructorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, total_students, average_rating, total_reviews, price, currency, status')
    .eq('instructor_id', user.id)

  const courseIds = courses?.map(c => c.id) || []

  const [{ data: payments }, { data: enrollments }, { data: completions }] = await Promise.all([
    supabase.from('payments').select('amount, created_at, currency').eq('status', 'success').in('course_id', courseIds),
    supabase.from('enrollments').select('id, enrolled_at, course_id').in('course_id', courseIds),
    supabase.from('enrollments').select('id').eq('status', 'completed').in('course_id', courseIds),
  ])

  const totalRevenue = payments?.reduce((s, p) => s + p.amount, 0) || 0
  const totalStudents = courses?.reduce((s, c) => s + c.total_students, 0) || 0
  const avgRating = courses?.filter(c => c.average_rating > 0).reduce((s, c) => s + c.average_rating, 0) / (courses?.filter(c => c.average_rating > 0).length || 1)

  // Monthly revenue last 6 months
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('default', { month: 'short' })
    const revenue = payments?.filter(p => {
      const pd = new Date(p.created_at)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
    }).reduce((s, p) => s + p.amount, 0) || 0
    const enrolled = enrollments?.filter(e => {
      const ed = new Date(e.enrolled_at)
      return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
    }).length || 0
    return { month, revenue, enrolled }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your teaching performance overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-50 text-green-600', trend: '+12%' },
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600', trend: '+8%' },
          { label: 'Completions', value: completions?.length || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600', trend: '' },
          { label: 'Avg. Rating', value: avgRating > 0 ? avgRating.toFixed(1) : 'N/A', icon: Star, color: 'bg-yellow-50 text-yellow-600', trend: '' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {s.trend && <p className="text-xs text-green-600 font-medium mt-1">{s.trend} this month</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <InstructorRevenueChart data={monthlyRevenue} />

      {/* Course performance table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Course Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Students</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Revenue</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {courses?.map(course => {
                const courseRevenue = payments?.filter(p => enrollments?.some(e => e.course_id === course.id))
                  .reduce((s, p) => s + p.amount, 0) || 0
                return (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{course.title}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        course.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{course.total_students}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {course.price === 0 ? 'Free' : formatCurrency(courseRevenue, course.currency)}
                    </td>
                    <td className="px-5 py-3">
                      {course.average_rating > 0 ? (
                        <span className="flex items-center gap-1 text-sm text-gray-700">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {course.average_rating.toFixed(1)} ({course.total_reviews})
                        </span>
                      ) : <span className="text-xs text-gray-400">No reviews yet</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
