import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { BookOpen, Star, Users } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

import AdminCourseActions from '@/components/admin/AdminCourseActions'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  let courses
  if (searchParams.status) {
    courses = await sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = ${searchParams.status}::course_status ORDER BY c.created_at DESC`
  } else {
    courses = await sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id ORDER BY c.created_at DESC`
  }
  const counts = { all: courses.length, published: courses.filter((c: any) => c.status === 'published').length, draft: courses.filter((c: any) => c.status === 'draft').length, archived: courses.filter((c: any) => c.status === 'archived').length }
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">All Courses</h1><p className="text-sm text-gray-500">{counts.all} total</p></div>
      <div className="flex gap-2 flex-wrap">
        {[['', 'All', counts.all], ['published', 'Published', counts.published], ['draft', 'Draft', counts.draft], ['archived', 'Archived', counts.archived]].map(([key, label, count]) => (
          <a key={key} href={key ? `/admin/courses?status=${key}` : '/admin/courses'} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(searchParams.status || '') === key ? 'bg-bloomy-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {label}<span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${(searchParams.status || '') === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
          </a>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">{['Course','Instructor','Status','Students','Rating','Price','Actions'].map(h => <th key={h} className={`text-${h === 'Actions' ? 'right' : 'left'} text-xs font-semibold text-gray-500 px-5 py-3`}>{h}</th>)}</tr></thead>
          <tbody>
            {courses.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bloomy-gradient rounded-lg flex items-center justify-center text-lg">{c.category_icon || '📚'}</div><div><p className="font-medium text-sm text-gray-900 max-w-[200px] truncate">{c.title}</p><p className="text-xs text-gray-400">{c.category_name}</p></div></div></td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.instructor_name}</td>
                <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.status === 'published' ? 'bg-green-50 text-green-700' : c.status === 'draft' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span></td>
                <td className="px-5 py-4 text-sm">{c.total_students}</td>
                <td className="px-5 py-4">{Number(c.average_rating) > 0 ? <span className="flex items-center gap-1 text-sm"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{Number(c.average_rating).toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}</td>
                <td className="px-5 py-4 text-sm font-medium">{Number(c.price) === 0 ? 'Free' : formatCurrency(Number(c.price), c.currency)}</td>
                <td className="px-5 py-4"><AdminCourseActions courseId={c.id} courseTitle={c.title} currentStatus={c.status} slug={c.slug} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className="text-center py-16"><BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No courses found</p></div>}
      </div>
    </div>
  )
}
