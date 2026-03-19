import { redirect } from 'next/navigation'

import Link from 'next/link'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { PlusCircle, Edit, Eye, Users, BookOpen, BarChart2 } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'My Courses — Instructor' }

export default async function InstructorCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const courses = await sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.instructor_id = ${userId} ORDER BY c.created_at DESC`
  const stats = { total: courses.length, published: courses.filter((c: any) => c.status === 'published').length, students: courses.reduce((s: number, c: any) => s + Number(c.total_students), 0) }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">My Courses</h1><p className="text-sm text-gray-500">{stats.total} total • {stats.published} published</p></div><Link href="/instructor/courses/new" className="btn-primary flex items-center gap-2"><PlusCircle className="w-4 h-4" /> New Course</Link></div>
      <div className="grid grid-cols-3 gap-4">
        {[{label:'Total Courses',value:stats.total,icon:BookOpen,color:'text-blue-600 bg-blue-50'},{label:'Published',value:stats.published,icon:Eye,color:'text-green-600 bg-green-50'},{label:'Students',value:stats.students,icon:Users,color:'text-purple-600 bg-purple-50'}].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100"><div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
        ))}
      </div>
      {courses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">{['Course','Status','Students','Price','Lessons','Actions'].map(h => <th key={h} className={`text-${h==='Actions'?'right':'left'} text-xs font-semibold text-gray-500 px-5 py-3`}>{h}</th>)}</tr></thead>
            <tbody>{courses.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg">{c.category_icon||'📚'}</div><div><p className="font-medium text-sm text-gray-900 line-clamp-1">{c.title}</p><p className="text-xs text-gray-400">{c.category_name}</p></div></div></td>
                <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.status==='published'?'bg-green-50 text-green-700':c.status==='draft'?'bg-yellow-50 text-yellow-700':'bg-gray-50 text-gray-600'}`}>{c.status}</span></td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.total_students}</td>
                <td className="px-5 py-4 text-sm font-medium">{Number(c.price)===0?'Free':formatCurrency(Number(c.price),c.currency)}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.total_lessons}</td>
                <td className="px-5 py-4"><div className="flex items-center justify-end gap-2">
                  <Link href={`/instructor/courses/${c.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></Link>
                  <Link href={`/courses/${c.slug}`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Eye className="w-4 h-4" /></Link>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="font-medium text-gray-700 mb-5">No courses yet</p><Link href="/instructor/courses/new" className="btn-primary inline-flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Create Course</Link></div>
      )}
    </div>
  )
}
