import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Search, Mail, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Students — Instructor' }

export default async function InstructorStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myCourses } = await supabase.from('courses').select('id').eq('instructor_id', user.id)
  const courseIds = myCourses?.map(c => c.id) || []

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles(id, full_name, email, avatar_url, location, created_at),
      course:courses(id, title)
    `)
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false })

  const uniqueStudents = new Map()
  enrollments?.forEach(e => {
    if (!uniqueStudents.has(e.student_id)) {
      uniqueStudents.set(e.student_id, { ...e.student, enrollments: [] })
    }
    uniqueStudents.get(e.student_id).enrollments.push(e)
  })

  const students = Array.from(uniqueStudents.values())

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">{students.length} unique students across your courses</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search students..." className="input-field pl-10 text-sm" />
          </div>
        </div>

        {students.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Courses</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Enrolled</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Progress</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const avgProgress = student.enrollments.reduce((s: number, e: any) => s + e.progress_percent, 0) / student.enrollments.length
                const hasCompleted = student.enrollments.some((e: any) => e.status === 'completed')
                return (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{student.enrollments.length}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {format(new Date(student.enrollments[0]?.enrolled_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bloomy-gradient rounded-full" style={{ width: `${avgProgress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{Math.round(avgProgress)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit ${hasCompleted ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {hasCompleted ? <><CheckCircle className="w-3 h-3" /> Completed</> : <><Clock className="w-3 h-3" /> Active</>}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No students enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
