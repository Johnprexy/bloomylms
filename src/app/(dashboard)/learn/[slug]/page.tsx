import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import CoursePlayer from '@/components/student/CoursePlayer'

export const dynamic = 'force-dynamic'

export default async function LearnPage({ params, searchParams }: { params: { slug: string }; searchParams: { lesson?: string; tab?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/login?redirect=/learn/${params.slug}`)
  const userId = (session.user as any).id

  const courses = await sql`
    SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.slug = ${params.slug} LIMIT 1
  `
  const course = courses[0]
  if (!course) notFound()

  const enrollments = await sql`SELECT * FROM enrollments WHERE student_id = ${userId} AND course_id = ${course.id} LIMIT 1`
  if (!enrollments[0]) redirect(`/dashboard`)

  // Include quiz_id, resources, and file_url for each lesson
  const modules = await sql`
    SELECT
      m.id, m.title, m.position, m.description,
      json_agg(
        json_build_object(
          'id', l.id,
          'title', l.title,
          'type', l.type,
          'content', l.content,
          'video_url', l.video_url,
          'file_url', l.file_url,
          'external_url', l.external_url,
          'video_duration', l.video_duration,
          'position', l.position,
          'is_preview', l.is_preview,
          'quiz_id', (SELECT q.id FROM quizzes q WHERE q.lesson_id = l.id LIMIT 1)
        ) ORDER BY l.position
      ) FILTER (WHERE l.id IS NOT NULL) as lessons
    FROM modules m
    LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = true
    WHERE m.course_id = ${course.id} AND m.is_published = true
    GROUP BY m.id
    ORDER BY m.position
  `

  const lessonProgress = await sql`
    SELECT * FROM lesson_progress WHERE student_id = ${userId} AND course_id = ${course.id}
  `

  return (
    <CoursePlayer
      course={course as any}
      modules={modules}
      enrollment={enrollments[0] as any}
      lessonProgress={lessonProgress as any}
      userId={userId}
      userName={(session.user as any).name || ''}
      initialLessonId={searchParams.lesson}
      initialTab={searchParams.tab as any}
    />
  )
}
