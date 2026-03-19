import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CoursePlayer from '@/components/student/CoursePlayer'

export default async function LearnPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/learn/${params.slug}`)

  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      category:categories(*),
      instructor:profiles(id, full_name, avatar_url),
      modules(
        id, title, position, is_published,
        lessons(id, title, type, content, video_url, video_duration, position, is_published, is_preview,
          resources(id, name, type, url, size_bytes))
      )
    `)
    .eq('slug', params.slug)
    .single()

  if (!course) notFound()

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) redirect(`/courses/${params.slug}`)

  // Get lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', course.id)

  const sortedModules = course.modules
    ?.filter((m: any) => m.is_published)
    .sort((a: any, b: any) => a.position - b.position)
    .map((m: any) => ({
      ...m,
      lessons: m.lessons
        ?.filter((l: any) => l.is_published)
        .sort((a: any, b: any) => a.position - b.position)
    }))

  return (
    <CoursePlayer
      course={course}
      modules={sortedModules}
      enrollment={enrollment}
      lessonProgress={lessonProgress || []}
      userId={user.id}
    />
  )
}
