import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'
import AdminCourseBuilder from '@/components/admin/AdminCourseBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminCourseContentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!isAdmin((session.user as any).role)) redirect('/dashboard')

  const courses = await sql`
    SELECT c.*, cat.name as category_name, u.full_name as instructor_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ${params.id} LIMIT 1`
  const course = courses[0]
  if (!course) notFound()

  const modules = await sql`
    SELECT m.id, m.title, m.position, m.is_published,
      COALESCE(json_agg(
        json_build_object(
          'id', l.id, 'title', l.title, 'type', l.type,
          'video_url', l.video_url, 'content', l.content,
          'video_duration', l.video_duration, 'position', l.position,
          'is_published', l.is_published, 'is_preview', l.is_preview
        ) ORDER BY l.position
      ) FILTER (WHERE l.id IS NOT NULL), '[]') as lessons
    FROM modules m
    LEFT JOIN lessons l ON l.module_id = m.id
    WHERE m.course_id = ${params.id}
    GROUP BY m.id ORDER BY m.position`

  const instructors = await sql`
    SELECT id, full_name, email FROM users
    WHERE role IN ('instructor','admin','super_admin') AND is_active = true
    ORDER BY full_name`

  const categories = await sql`SELECT id, name, icon FROM categories ORDER BY name`

  return (
    <AdminCourseBuilder
      course={course}
      modules={modules}
      instructors={instructors}
      categories={categories}
      role={(session.user as any).role}
    />
  )
}
