import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { BookOpen, Play, CheckCircle, Clock, FileText, FlaskConical, Award, ChevronRight, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const role = (session.user as any).role

  // Redirect admins/instructors to their own dashboards
  if (role === 'admin' || role === 'super_admin') redirect('/admin/analytics')
  if (role === 'instructor') redirect('/instructor/courses')

  // Fetch ONLY the student's enrolled courses
  const enrollments = await sql`
    SELECT
      e.id as enrollment_id, e.status, e.progress_percent, e.enrolled_at, e.last_accessed_at,
      c.id as course_id, c.title, c.slug, c.description, c.duration_weeks, c.total_lessons,
      c.difficulty, c.tags,
      cat.name as category_name, cat.icon as category_icon,
      u.full_name as instructor_name,
      (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND m.is_published = true) as module_count,
      (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.student_id = ${userId} AND lp.course_id = c.id AND lp.completed = true) as completed_lessons
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = ${userId}
    ORDER BY e.last_accessed_at DESC NULLS LAST, e.enrolled_at DESC
  `

  // Recent activity
  const recentActivity = await sql`
    SELECT lp.completed_at, l.title as lesson_title, c.title as course_title
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN courses c ON lp.course_id = c.id
    WHERE lp.student_id = ${userId} AND lp.completed = true
    ORDER BY lp.completed_at DESC LIMIT 5
  `

  const name = (session.user as any).name || 'Student'
  const firstName = name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const totalCompleted = enrollments.filter((e: any) => e.status === 'completed').length
  const inProgress = enrollments.filter((e: any) => e.status === 'active' && Number(e.progress_percent) > 0).length
  const totalLessonsCompleted = enrollments.reduce((s: number, e: any) => s + Number(e.completed_lessons), 0)

  // No courses enrolled
  if (enrollments.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">No courses yet</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          You haven't been assigned to any courses yet.
        </p>
        <p className="text-gray-400 text-xs">
          Your instructor will enroll you once your registration is confirmed. Contact <a href="mailto:support@bloomy360.com" className="text-bloomy-600">support@bloomy360.com</a> if you think this is a mistake.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Greeting */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{greeting}, {firstName}! 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {enrollments.length === 1
            ? `You are enrolled in 1 course`
            : `You are enrolled in ${enrollments.length} courses`}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Courses', value: enrollments.length, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'Completed', value: totalCompleted, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Lessons Done', value: totalLessonsCompleted, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3.5 border border-gray-100">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* My Courses — the main content */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">My Courses</h2>
        <div className="space-y-3">
          {enrollments.map((e: any) => {
            const progress = Math.round(Number(e.progress_percent))
            const isDone = e.status === 'completed'
            const totalLessons = Number(e.total_lessons) || 0
            const doneLessons = Number(e.completed_lessons) || 0

            return (
              <div key={e.enrollment_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Course header */}
                <div className="p-4 lg:p-5">
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div className="w-12 h-12 bloomy-gradient rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {e.category_icon || '📚'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm lg:text-base leading-snug">{e.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">by {e.instructor_name} · {e.duration_weeks} weeks</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                          isDone ? 'bg-green-100 text-green-700' : progress > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isDone ? '✓ Done' : progress > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>{doneLessons} of {totalLessons} lessons</span>
                          <span className={`font-semibold ${isDone ? 'text-green-600' : 'text-bloomy-600'}`}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-500' : 'bloomy-gradient'}`}
                            style={{ width: `${Math.max(progress, progress > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="border-t border-gray-50 grid grid-cols-3 divide-x divide-gray-50">
                  <Link href={`/learn/${e.slug}`}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-bloomy-600 hover:bg-bloomy-50 transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    {progress > 0 ? 'Continue' : 'Start'}
                  </Link>
                  <Link href={`/learn/${e.slug}?tab=resources`}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    Materials
                  </Link>
                  <Link href={`/learn/${e.slug}?tab=discussions`}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <FlaskConical className="w-3.5 h-3.5" />
                    Labs
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {recentActivity.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.lesson_title}</p>
                  <p className="text-xs text-gray-400 truncate">{a.course_title}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(a.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate prompt if any completed */}
      {totalCompleted > 0 && (
        <Link href="/dashboard/certificates"
          className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">
              {totalCompleted} certificate{totalCompleted > 1 ? 's' : ''} earned!
            </p>
            <p className="text-xs text-gray-500">View and download your certificates</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      )}
    </div>
  )
}
