import { redirect } from 'next/navigation'

import Link from 'next/link'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { Play, CheckCircle, Clock, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'My Courses' }

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const enrollments = await sql`SELECT e.*, c.title, c.slug, c.thumbnail_url, c.total_lessons, c.duration_weeks, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM enrollments e JOIN courses c ON e.course_id = c.id LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE e.student_id = ${userId} ORDER BY e.enrolled_at DESC`
  const active = enrollments.filter((e: any) => e.status === 'active')
  const completed = enrollments.filter((e: any) => e.status === 'completed')

  const Card = ({ e }: { e: any }) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
      <div className="h-32 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center">
        {e.thumbnail_url ? <img src={e.thumbnail_url} alt={e.title} className="w-full h-full object-cover" /> : <span className="text-4xl">{e.category_icon || '📚'}</span>}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{e.title}</h3>
        <p className="text-xs text-gray-400 mb-3">by {e.instructor_name}</p>
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span className={`font-semibold ${e.status === 'completed' ? 'text-green-600' : 'text-bloomy-600'}`}>{Math.round(Number(e.progress_percent))}%</span></div>
          <div className="h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${e.status === 'completed' ? 'bg-green-500' : 'bloomy-gradient'}`} style={{ width: `${e.progress_percent}%` }} /></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {e.total_lessons}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.duration_weeks}w</span>
          </div>
          <Link href={`/learn/${e.slug}`} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"><Play className="w-3 h-3" />{e.status === 'completed' ? 'Review' : 'Continue'}</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">My Courses</h1><p className="text-gray-500 text-sm mt-1">{enrollments.length} enrolled</p></div>
      {enrollments.length === 0 && <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="font-medium text-gray-700 mb-5">No courses yet</p><Link href="/courses" className="btn-primary inline-flex">Browse Courses</Link></div>}
      {active.length > 0 && <div><h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> In Progress ({active.length})</h2><div className="grid md:grid-cols-2 gap-4">{active.map((e: any) => <Card key={e.id} e={e} />)}</div></div>}
      {completed.length > 0 && <div><h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Completed ({completed.length})</h2><div className="grid md:grid-cols-2 gap-4">{completed.map((e: any) => <Card key={e.id} e={e} />)}</div></div>}
    </div>
  )
}
