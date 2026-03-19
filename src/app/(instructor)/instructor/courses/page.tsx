import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlusCircle, Edit, Eye, Users, BookOpen, BarChart2, MoreVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'My Courses — Instructor' }

export default async function InstructorCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select(`*, category:categories(name, icon)`)
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: courses?.length || 0,
    published: courses?.filter(c => c.status === 'published').length || 0,
    students: courses?.reduce((s, c) => s + c.total_students, 0) || 0,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.total} total • {stats.published} published</p>
        </div>
        <Link href="/instructor/courses/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Courses', value: stats.total, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Published', value: stats.published, icon: Eye, color: 'text-green-600 bg-green-50' },
          { label: 'Total Students', value: stats.students, icon: Users, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Courses table */}
      {courses && courses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Course</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Students</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Lessons</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                          {course.category?.icon || '📚'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 line-clamp-1">{course.title}</p>
                          <p className="text-xs text-gray-400">{course.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        course.status === 'published' ? 'bg-green-50 text-green-700' :
                        course.status === 'draft' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{course.total_students}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      {course.price === 0 ? 'Free' : formatCurrency(course.price, course.currency)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{course.total_lessons}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/instructor/courses/${course.id}/edit`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/courses/${course.slug}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/instructor/courses/${course.id}/analytics`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Analytics"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No courses yet</p>
          <p className="text-sm text-gray-400 mb-5">Create your first course and start teaching</p>
          <Link href="/instructor/courses/new" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Create Course
          </Link>
        </div>
      )}
    </div>
  )
}
