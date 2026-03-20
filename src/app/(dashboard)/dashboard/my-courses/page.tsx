import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Play, CheckCircle, Clock, BookOpen, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Courses' }

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  // Only courses this student is enrolled in
  const enrollments = await sql`
    SELECT
      e.id as enrollment_id, e.status, e.progress_percent, e.enrolled_at,
      c.id as course_id, c.title, c.slug, c.thumbnail_url,
      c.total_lessons, c.duration_weeks,
      cat.name as category_name, cat.icon as category_icon,
      u.full_name as instructor_name,
      (SELECT COUNT(*) FROM lesson_progress lp
       WHERE lp.student_id = ${userId} AND lp.course_id = c.id AND lp.completed = true
      ) as completed_lessons
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = ${userId}
    ORDER BY e.enrolled_at DESC
  `

  const active = enrollments.filter((e: any) => e.status !== 'completed')
  const completed = enrollments.filter((e: any) => e.status === 'completed')

  if (enrollments.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No courses yet</h1>
        <p className="text-gray-500 text-sm">You haven't been assigned to any courses yet. Contact your instructor or admin.</p>
      </div>
    )
  }

  const CourseCard = ({ e }: { e: any }) => {
    const progress = Math.round(Number(e.progress_percent) || 0)
    const done = Number(e.completed_lessons) || 0
    const total = Number(e.total_lessons) || 0
    const isDone = e.status === 'completed'

    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center relative">
          {e.thumbnail_url
            ? <img src={e.thumbnail_url} alt={e.title} className="w-full h-full object-cover" />
            : <span className="text-5xl">{e.category_icon || '📚'}</span>
          }
          {isDone && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Done
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-2">{e.title}</h3>
          <p className="text-xs text-gray-400 mb-3">by {e.instructor_name || 'Bloomy Technologies'}</p>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{done}/{total} lessons</span>
              <span className={`font-semibold ${isDone ? 'text-green-600' : 'text-bloomy-600'}`}>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-500' : 'bloomy-gradient'}`}
                style={{ width: `${Math.max(progress, progress > 0 ? 4 : 0)}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{total} lessons</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.duration_weeks}w</span>
            </div>
            <Link href={`/learn/${e.slug}`}
              className="flex items-center gap-1.5 btn-primary text-xs py-1.5 px-4">
              <Play className="w-3 h-3" />
              {progress > 0 ? 'Continue' : 'Start'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-400">{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>
        </div>
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> In Progress ({active.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((e: any) => <CourseCard key={e.enrollment_id} e={e} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Completed ({completed.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((e: any) => <CourseCard key={e.enrollment_id} e={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}
