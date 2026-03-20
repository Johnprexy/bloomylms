import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'
import { ArrowLeft } from 'lucide-react'
import EnrollUserForm from '@/components/admin/EnrollUserForm'

export const dynamic = 'force-dynamic'

export default async function EnrollUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!isAdmin((session.user as any).role)) redirect('/dashboard')

  const users = await sql`SELECT id, full_name, email, role FROM users WHERE id = ${params.id} LIMIT 1`
  const user = users[0]
  if (!user) notFound()

  const courses = await sql`
    SELECT c.id, c.title, c.slug, c.status, cat.icon
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.title`

  const enrollments = await sql`
    SELECT course_id FROM enrollments WHERE student_id = ${params.id}`
  const enrolledIds = enrollments.map((e: any) => e.course_id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enroll Student in Course</h1>
          <p className="text-sm text-gray-500">{user.full_name} · {user.email}</p>
        </div>
      </div>
      <EnrollUserForm userId={params.id} courses={courses} enrolledIds={enrolledIds} />
    </div>
  )
}
