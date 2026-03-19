import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Eye, EyeOff, Star, Users, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import AdminCourseActions from '@/components/admin/AdminCourseActions'

export const metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('courses')
    .select(`*, category:categories(name, icon), instructor:profiles(full_name, email)`)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: courses } = await query

  const counts = {
    all: courses?.length || 0,
    published: courses?.filter(c => c.status === 'published').length || 0,
    draft: courses?.filter(c => c.status === 'draft').length || 0,
    archived: courses?.filter(c => c.status === 'archived').length || 0,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.all} total courses</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'All', count: counts.all },
          { key: 'published', label: 'Published', count: counts.published },
          { key: 'draft', label: 'Draft', count: counts.draft },
          { key: 'archived', label: 'Archived', count: counts.archived },
        ].map(tab => (
          <a
            key={tab.key}
            href={tab.key ? `/admin/courses?status=${tab.key}` : '/admin/courses'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              (searchParams.status || '') === tab.key
                ? 'bg-bloomy-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              (searchParams.status || '') === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Instructor</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Students</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Rating</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Price</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses?.map(course => (
                <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {(course.category as any)?.icon || '📚'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 max-w-[200px] truncate">{course.title}</p>
                        <p className="text-xs text-gray-400">{(course.category as any)?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-700">{(course.instructor as any)?.full_name}</p>
                    <p className="text-xs text-gray-400">{(course.instructor as any)?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      course.status === 'published' ? 'bg-green-50 text-green-700' :
                      course.status === 'draft' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" /> {course.total_students}
                  </td>
                  <td className="px-5 py-4">
                    {course.average_rating > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-gray-700">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {course.average_rating.toFixed(1)}
                      </span>
                    ) : <span className="text-xs text-gray-400">No reviews</span>}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    {course.price === 0 ? 'Free' : formatCurrency(course.price, course.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <AdminCourseActions courseId={course.id} currentStatus={course.status} slug={course.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!courses || courses.length === 0) && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No courses found</p>
          </div>
        )}
      </div>
    </div>
  )
}
