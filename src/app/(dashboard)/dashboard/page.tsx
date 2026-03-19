import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, Award, TrendingUp, ArrowRight, Play, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`*, course:courses(id, title, slug, thumbnail_url, category:categories(name, icon), instructor:profiles(full_name), total_lessons)`)
    .eq('student_id', user.id)
    .order('last_accessed_at', { ascending: false })
    .limit(6)

  // Fetch available courses
  const { data: availableCourses } = await supabase
    .from('courses')
    .select(`*, category:categories(name, icon), instructor:profiles(full_name)`)
    .eq('status', 'published')
    .limit(4)

  const stats = {
    enrolled: enrollments?.length || 0,
    completed: enrollments?.filter(e => e.status === 'completed').length || 0,
    in_progress: enrollments?.filter(e => e.progress_percent > 0 && e.progress_percent < 100).length || 0,
    avg_progress: enrollments?.length ? Math.round(enrollments.reduce((s, e) => s + e.progress_percent, 0) / enrollments.length) : 0,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {profile?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Continue your learning journey today</p>
        </div>
        <Link href="/courses" className="btn-primary text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Explore Courses
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Courses', value: stats.enrolled, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Avg. Progress', value: `${stats.avg_progress}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {enrollments && enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
            <Link href="/dashboard/my-courses" className="text-sm text-bloomy-600 hover:text-bloomy-700 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 3).map(enrollment => (
              <Link key={enrollment.id} href={`/learn/${enrollment.course.slug}`} className="bg-white rounded-xl border border-gray-100 p-4 card-hover group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {enrollment.course.category?.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-bloomy-700 transition-colors">{enrollment.course.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">by {enrollment.course.instructor?.full_name}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-bloomy-600">{Math.round(enrollment.progress_percent)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bloomy-gradient rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    enrollment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {enrollment.status === 'completed' ? '✓ Completed' : 'In Progress'}
                  </span>
                  <span className="text-bloomy-600 group-hover:text-bloomy-700">
                    <Play className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Explore New Courses */}
      {availableCourses && availableCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Explore Courses</h2>
            <Link href="/courses" className="text-sm text-bloomy-600 hover:text-bloomy-700 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableCourses.map(course => {
              const enrolled = enrollments?.some(e => e.course_id === course.id)
              return (
                <Link key={course.id} href={`/courses/${course.slug}`} className="bg-white rounded-xl border border-gray-100 p-4 card-hover group">
                  <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg mb-3">
                    {course.category?.icon || '📚'}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-bloomy-700 transition-colors">{course.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">by {course.instructor?.full_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-bloomy-700">{course.price === 0 ? 'Free' : formatCurrency(course.price, course.currency)}</span>
                    {enrolled ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Enrolled</span>
                    ) : (
                      <span className="text-xs text-bloomy-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Enroll <ArrowRight className="w-3 h-3" /></span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!enrollments || enrollments.length === 0) && (
        <div className="bg-gradient-to-br from-bloomy-50 to-blue-50 rounded-2xl p-12 text-center border border-bloomy-100">
          <div className="w-16 h-16 bloomy-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Start your learning journey</h2>
          <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">Enroll in your first course and join thousands of students transforming their tech careers.</p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2">
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
