import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { Users, CheckCircle, Clock } from 'lucide-react'

import { format } from 'date-fns'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Students — Instructor' }

export default async function InstructorStudentsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const enrollments = await sql`SELECT e.*, u.full_name, u.email, u.location, c.title as course_title FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ${userId} ORDER BY e.enrolled_at DESC`
  const uniqueStudents = new Map()
  enrollments.forEach((e: any) => { if (!uniqueStudents.has(e.student_id)) { uniqueStudents.set(e.student_id, { ...e, enrollments: [] }) }; uniqueStudents.get(e.student_id).enrollments.push(e) })
  const students = Array.from(uniqueStudents.values())
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Students</h1><p className="text-sm text-gray-500">{students.length} unique students</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {students.length > 0 ? (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">{['Student','Courses','Enrolled','Progress','Status'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>{students.map((s: any) => {
              const avg = s.enrollments.reduce((a: number, e: any) => a + Number(e.progress_percent), 0) / s.enrollments.length
              const done = s.enrollments.some((e: any) => e.status === 'completed')
              return (
                <tr key={s.student_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">{s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div><div><p className="font-medium text-sm text-gray-900">{s.full_name}</p><p className="text-xs text-gray-400">{s.email}</p></div></div></td>
                  <td className="px-5 py-4 text-sm text-gray-700">{s.enrollments.length}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{format(new Date(s.enrollments[0].enrolled_at), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><div className="w-20 h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bloomy-gradient rounded-full" style={{ width: `${avg}%` }} /></div><span className="text-xs text-gray-500">{Math.round(avg)}%</span></div></td>
                  <td className="px-5 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit ${done ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{done ? <><CheckCircle className="w-3 h-3" />Completed</> : <><Clock className="w-3 h-3" />Active</>}</span></td>
                </tr>
              )
            })}</tbody>
          </table>
        ) : (
          <div className="text-center py-16"><Users className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No students yet</p></div>
        )}
      </div>
    </div>
  )
}
