import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Play, CheckCircle, Clock, BookOpen } from 'lucide-react'

export const metadata = { title: 'My Courses' }

export default async function MyCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id, title, slug, thumbnail_url, total_lessons, duration_weeks,
        category:categories(name, icon),
        instructor:profiles(full_name)
      )
    `)
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  const active = enrollments?.filter(e => e.status === 'active') || []
  const completed = enrollments?.filter(e => e.status === 'completed') || []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500 text-sm mt-1">{enrollments?.length || 0} enrolled courses</p>
      </div>

      {enrollments?.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No courses yet</p>
          <p className="text-sm text-gray-400 mb-5">Enroll in a course to get started</p>
          <Link href="/courses" className="btn-primary inline-flex">Browse Courses</Link>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> In Progress ({active.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {active.map(e => (
              <CourseCard key={e.id} enrollment={e} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Completed ({completed.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {completed.map(e => (
              <CourseCard key={e.id} enrollment={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CourseCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.course
  const isCompleted = enrollment.status === 'completed'

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
      <div className="h-32 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{course.category?.icon || '📚'}</span>
        )}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-xs text-gray-400 mb-3">by {course.instructor?.full_name}</p>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-bloomy-600'}`}>
              {Math.round(enrollment.progress_percent)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bloomy-gradient'}`}
              style={{ width: `${enrollment.progress_percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.total_lessons} lessons</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_weeks}w</span>
          </div>
          <Link
            href={`/learn/${course.slug}`}
            className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            {isCompleted ? 'Review' : 'Continue'}
          </Link>
        </div>
      </div>
    </div>
  )
}
