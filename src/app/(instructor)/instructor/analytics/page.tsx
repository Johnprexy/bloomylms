import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { TrendingUp, Users, DollarSign, Star, BookOpen } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

import InstructorRevenueChart from '@/components/instructor/InstructorRevenueChart'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Analytics — Instructor' }

export default async function InstructorAnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const [courses, payments, enrollments, completions] = await Promise.all([
    sql`SELECT id, title, total_students, average_rating, total_reviews, price, currency, status FROM courses WHERE instructor_id = ${userId}`,
    sql`SELECT amount, created_at FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.instructor_id = ${userId} AND p.status = 'success'`,
    sql`SELECT enrolled_at, course_id FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ${userId}`,
    sql`SELECT course_id FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ${userId} AND e.status = 'completed'`,
  ])

  const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalStudents = courses.reduce((s: number, c: any) => s + Number(c.total_students), 0)
  const ratedCourses = courses.filter((c: any) => Number(c.average_rating) > 0)
  const avgRating = ratedCourses.length ? (ratedCourses.reduce((s: number, c: any) => s + Number(c.average_rating), 0) / ratedCourses.length).toFixed(1) : "0.0"

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString("default", { month: "short" })
    const revenue = payments.filter((p: any) => { const pd = new Date(p.created_at); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() }).reduce((s: number, p: any) => s + Number(p.amount), 0)
    const enrolled = enrollments.filter((e: any) => { const ed = new Date(e.enrolled_at); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() }).length
    return { month, revenue, enrolled }
  })

  const courseStats = courses.map((c: any) => ({
    ...c,
    revenue: payments.filter((p: any) => p.course_id === c.id).reduce((s: number, p: any) => s + Number(p.amount), 0),
    completions: completions.filter((e: any) => e.course_id === c.id).length,
  })).sort((a: any, b: any) => b.revenue - a.revenue)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-sm text-gray-500">Track your course performance</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600", sub: "all time" },
          { label: "Total Students", value: totalStudents, icon: Users, color: "bg-blue-50 text-blue-600", sub: "enrolled" },
          { label: "Avg. Rating", value: avgRating === "0.0" ? "N/A" : `${avgRating} ★`, icon: Star, color: "bg-yellow-50 text-yellow-600", sub: "across courses" },
          { label: "Active Courses", value: courses.filter((c: any) => c.status === "published").length, icon: BookOpen, color: "bg-purple-50 text-purple-600", sub: "published" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-700 font-medium mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>
      <InstructorRevenueChart data={monthlyData} />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-900">Course Performance</h2></div>
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">{["Course","Status","Students","Completions","Rating","Revenue"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {courseStats.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4"><p className="font-medium text-sm text-gray-900 max-w-xs truncate">{c.title}</p><p className="text-xs text-gray-400">{Number(c.price) === 0 ? "Free" : formatCurrency(Number(c.price), c.currency)}</p></td>
                <td className="px-5 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "published" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{c.status}</span></td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.total_students}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.completions}</td>
                <td className="px-5 py-4">{Number(c.average_rating) > 0 ? <span className="flex items-center gap-1 text-sm"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{Number(c.average_rating).toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}</td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {courseStats.length === 0 && <div className="text-center py-12 text-gray-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No data yet — publish a course to see analytics</p></div>}
      </div>
    </div>
  )
}
