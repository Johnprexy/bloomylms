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
    sql`SELECT e.*, c.id as course_id, c.title, c.slug, c.thumbnail_url, c.total_lessons,
        c.duration_weeks, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name
        FROM enrollments e JOIN courses c ON e.course_id = c.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE e.student_id = ${userId} ORDER BY e.last_accessed_at DESC NULLS LAST LIMIT 6`,
    sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name
        FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.status = 'published' ORDER BY c.is_featured DESC LIMIT 4`,
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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{greeting}, {name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Continue your learning journey</p>
        </div>
        <Link href="/courses" className="btn-primary text-xs lg:text-sm flex items-center gap-1.5 flex-shrink-0 py-2 px-3 lg:px-6">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Explore </span>Courses
        </Link>
      </div>

      {/* Stats — 2x2 on mobile, 4x1 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Enrolled', value: stats.enrolled, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Avg Progress', value: `${stats.avg_progress}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2.5`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base lg:text-lg font-bold text-gray-900">Continue Learning</h2>
            <Link href="/dashboard/my-courses" className="text-xs text-bloomy-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {enrollments.slice(0, 3).map((e: any) => (
              <Link key={e.id} href={`/learn/${e.slug}`}
                className="bg-white rounded-xl border border-gray-100 p-4 flex-shrink-0 w-64 lg:w-auto card-hover group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {e.category_icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-bloomy-700">{e.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">by {e.instructor_name}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-bloomy-600">{Math.round(Number(e.progress_percent))}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bloomy-gradient rounded-full" style={{ width: `${e.progress_percent}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {e.status === 'completed' ? '✓ Done' : 'In Progress'}
                  </span>
                  <Play className="w-4 h-4 text-bloomy-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base lg:text-lg font-bold text-gray-900">Explore Courses</h2>
            <Link href="/courses" className="text-xs text-bloomy-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {availableCourses.map((c: any) => {
              const enrolled = enrollments.some((e: any) => e.course_id === c.id)
              return (
                <Link key={c.id} href={`/courses/${c.slug}`}
                  className="bg-white rounded-xl border border-gray-100 p-3.5 card-hover group">
                  <div className="w-9 h-9 bloomy-gradient rounded-lg flex items-center justify-center text-base mb-2.5">
                    {c.category_icon || '📚'}
                  </div>
                  <h3 className="font-semibold text-xs text-gray-900 mb-1 line-clamp-2 group-hover:text-bloomy-700">{c.title}</h3>
                  <p className="text-xs text-gray-400 mb-2.5 truncate">by {c.instructor_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-bloomy-700">
                      {Number(c.price) === 0 ? 'Free' : formatCurrency(Number(c.price), c.currency)}
                    </span>
                    {enrolled
                      ? <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓</span>
                      : <ArrowRight className="w-3 h-3 text-bloomy-400 group-hover:text-bloomy-600" />
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {enrollments.length === 0 && (
        <div className="bg-gradient-to-br from-bloomy-50 to-blue-50 rounded-2xl p-8 text-center border border-bloomy-100">
          <div className="w-14 h-14 bloomy-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Start your learning journey</h2>
          <p className="text-gray-500 mb-5 text-sm max-w-xs mx-auto">Enroll in your first course and join thousands of students transforming their tech careers.</p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2 text-sm">
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
