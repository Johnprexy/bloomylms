import { redirect } from 'next/navigation'

import Link from 'next/link'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { BookOpen, Clock, CheckCircle, TrendingUp, ArrowRight, Play } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'


export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const [enrollments, availableCourses] = await Promise.all([
    sql`SELECT e.*, c.id as course_id, c.title, c.slug, c.thumbnail_url, c.total_lessons, c.duration_weeks, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM enrollments e JOIN courses c ON e.course_id = c.id LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE e.student_id = ${userId} ORDER BY e.last_accessed_at DESC NULLS LAST LIMIT 6`,
    sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = 'published' ORDER BY c.is_featured DESC LIMIT 4`,
  ])

  const stats = {
    enrolled: enrollments.length,
    completed: enrollments.filter((e: any) => e.status === 'completed').length,
    in_progress: enrollments.filter((e: any) => e.progress_percent > 0 && e.progress_percent < 100).length,
    avg_progress: enrollments.length ? Math.round(enrollments.reduce((s: number, e: any) => s + Number(e.progress_percent), 0) / enrollments.length) : 0,
  }

  const name = (session.user as any).name || session.user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Continue your learning journey today</p>
        </div>
        <Link href="/courses" className="btn-primary text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Explore Courses</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: stats.enrolled, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Avg. Progress', value: `${stats.avg_progress}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
            <Link href="/dashboard/my-courses" className="text-sm text-bloomy-600 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 3).map((e: any) => (
              <Link key={e.id} href={`/learn/${e.slug}`} className="bg-white rounded-xl border border-gray-100 p-4 card-hover group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg flex-shrink-0">{e.category_icon || '📚'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-bloomy-700 transition-colors">{e.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">by {e.instructor_name}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span className="font-medium text-bloomy-600">{Math.round(Number(e.progress_percent))}%</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bloomy-gradient rounded-full" style={{ width: `${e.progress_percent}%` }} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{e.status === 'completed' ? '✓ Completed' : 'In Progress'}</span>
                  <Play className="w-4 h-4 text-bloomy-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {availableCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Explore Courses</h2>
            <Link href="/courses" className="text-sm text-bloomy-600 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableCourses.map((c: any) => {
              const enrolled = enrollments.some((e: any) => e.course_id === c.id)
              return (
                <Link key={c.id} href={`/courses/${c.slug}`} className="bg-white rounded-xl border border-gray-100 p-4 card-hover group">
                  <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg mb-3">{c.category_icon || '📚'}</div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-bloomy-700">{c.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">by {c.instructor_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-bloomy-700">{Number(c.price) === 0 ? 'Free' : formatCurrency(Number(c.price), c.currency)}</span>
                    {enrolled ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Enrolled</span> : <span className="text-xs text-bloomy-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Enroll <ArrowRight className="w-3 h-3" /></span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {enrollments.length === 0 && (
        <div className="bg-gradient-to-br from-bloomy-50 to-blue-50 rounded-2xl p-12 text-center border border-bloomy-100">
          <div className="w-16 h-16 bloomy-gradient rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-white" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Start your learning journey</h2>
          <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">Enroll in your first course and join thousands of students transforming their tech careers.</p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2">Browse Courses <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}
    </div>
  )
}
