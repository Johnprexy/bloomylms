'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Course, Module, Lesson } from '@/types'

export async function getCourses(filters?: { category?: string; status?: string; search?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select(`*, category:categories(*), instructor:profiles(id, full_name, avatar_url)`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (filters?.category) query = query.eq('categories.slug', filters.category)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function getCourseBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      category:categories(*),
      instructor:profiles(id, full_name, avatar_url, bio),
      modules(*, lessons(id, title, type, video_duration, position, is_published, is_preview))
    `)
    .eq('slug', slug)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function getEnrolledCourses(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`*, course:courses(*, category:categories(*), instructor:profiles(id, full_name, avatar_url))`)
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function createCourse(courseData: Partial<Course>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('courses')
    .insert({ ...courseData, instructor_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/instructor/courses')
  return { data }
}

export async function updateCourse(id: string, updates: Partial<Course>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/instructor/courses')
  revalidatePath(`/courses/${updates.slug}`)
  return { data }
}

export async function createModule(moduleData: Partial<Module>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .insert(moduleData)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function createLesson(lessonData: Partial<Lesson>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonData)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function getInstructorStats(instructorId: string) {
  const supabase = await createClient()

  const [courses, enrollments, payments] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('instructor_id', instructorId),
    supabase.from('enrollments').select('id', { count: 'exact' }).in(
      'course_id',
      (await supabase.from('courses').select('id').eq('instructor_id', instructorId)).data?.map(c => c.id) || []
    ),
    supabase.from('payments').select('amount').eq('status', 'success').in(
      'course_id',
      (await supabase.from('courses').select('id').eq('instructor_id', instructorId)).data?.map(c => c.id) || []
    ),
  ])

  return {
    total_courses: courses.count || 0,
    total_students: enrollments.count || 0,
    total_revenue: payments.data?.reduce((sum, p) => sum + p.amount, 0) || 0,
  }
}
