'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'


export async function getCourses(filters?: { category?: string; search?: string; difficulty?: string }) {
  try {
    let query = `
      SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.slug as category_slug,
             u.full_name as instructor_name, u.avatar_url as instructor_avatar
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.status = 'published'
    `
    const params: any[] = []
    let i = 1

    if (filters?.search) { query += ` AND c.title ILIKE $${i++}`; params.push(`%${filters.search}%`) }
    if (filters?.difficulty) { query += ` AND c.difficulty = $${i++}`; params.push(filters.difficulty) }
    if (filters?.category) { query += ` AND cat.slug = $${i++}`; params.push(filters.category) }

    query += ' ORDER BY c.is_featured DESC, c.total_students DESC'

    const courses = await sql(query as any, params as any)
    return { data: courses }
  } catch (err) {
    return { error: 'Failed to fetch courses' }
  }
}

export async function getCourseBySlug(slug: string) {
  try {
    const courses = await sql`
      SELECT c.*, cat.name as category_name, cat.icon as category_icon,
             u.full_name as instructor_name, u.avatar_url as instructor_avatar, u.bio as instructor_bio
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.slug = ${slug} AND c.status = 'published'
      LIMIT 1
    `
    if (!courses[0]) return { error: 'Course not found' }

    const modules = await sql`
      SELECT m.*, json_agg(
        json_build_object('id', l.id, 'title', l.title, 'type', l.type,
          'video_duration', l.video_duration, 'position', l.position,
          'is_published', l.is_published, 'is_preview', l.is_preview)
        ORDER BY l.position
      ) FILTER (WHERE l.id IS NOT NULL) as lessons
      FROM modules m
      LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = true
      WHERE m.course_id = ${courses[0].id}
      GROUP BY m.id ORDER BY m.position
    `

    return { data: { ...courses[0], modules } }
  } catch (err) {
    return { error: 'Failed to fetch course' }
  }
}

export async function getEnrolledCourses(studentId: string) {
  try {
    const enrollments = await sql`
      SELECT e.*, c.id as course_id, c.title, c.slug, c.thumbnail_url, c.total_lessons,
             c.duration_weeks, cat.name as category_name, cat.icon as category_icon,
             u.full_name as instructor_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE e.student_id = ${studentId}
      ORDER BY e.enrolled_at DESC
    `
    return { data: enrollments }
  } catch {
    return { error: 'Failed to fetch enrollments' }
  }
}

export async function createCourse(courseData: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Not authenticated' }
  const userId = (session.user as any).id

  try {
    const slug = courseData.slug || slugify(courseData.title)
    const courses = await sql`
      INSERT INTO courses (title, slug, description, short_description, category_id,
        instructor_id, price, currency, duration_weeks, difficulty, status,
        requirements, what_you_learn, tags, certificate_enabled)
      VALUES (
        ${courseData.title}, ${slug}, ${courseData.description || ''},
        ${courseData.short_description || null}, ${courseData.category_id || null},
        ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'},
        ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
        'draft', ${courseData.requirements || []}, ${courseData.what_you_learn || []},
        ${courseData.tags || []}, ${courseData.certificate_enabled !== false}
      ) RETURNING *
    `
    revalidatePath('/instructor/courses')
    return { data: courses[0] }
  } catch (err: any) {
    return { error: err.message || 'Failed to create course' }
  }
}

export async function updateCourse(id: string, updates: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Not authenticated' }

  try {
    const courses = await sql`
      UPDATE courses SET
        title = COALESCE(${updates.title}, title),
        description = COALESCE(${updates.description}, description),
        short_description = COALESCE(${updates.short_description}, short_description),
        price = COALESCE(${updates.price}, price),
        currency = COALESCE(${updates.currency}, currency),
        difficulty = COALESCE(${updates.difficulty}::difficulty_level, difficulty),
        status = COALESCE(${updates.status}::course_status, status),
        is_featured = COALESCE(${updates.is_featured}, is_featured),
        requirements = COALESCE(${updates.requirements}, requirements),
        what_you_learn = COALESCE(${updates.what_you_learn}, what_you_learn),
        tags = COALESCE(${updates.tags}, tags),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    revalidatePath('/instructor/courses')
    return { data: courses[0] }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Not authenticated' }
  const userId = (session.user as any).id

  try {
    await sql`
      INSERT INTO lesson_progress (student_id, lesson_id, course_id, completed, completed_at)
      VALUES (${userId}, ${lessonId}, ${courseId}, true, NOW())
      ON CONFLICT (student_id, lesson_id)
      DO UPDATE SET completed = true, completed_at = NOW()
    `

    // Recalculate progress
    const total = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${courseId} AND is_published = true`
    const done = await sql`
      SELECT COUNT(*) as n FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.student_id = ${userId} AND l.course_id = ${courseId} AND lp.completed = true
    `

    const totalN = Number(total[0]?.n || 1)
    const doneN = Number(done[0]?.n || 0)
    const progress = Math.round((doneN / totalN) * 100)

    await sql`
      UPDATE enrollments SET
        progress_percent = ${progress},
        status = CASE WHEN ${progress} >= 100 THEN 'completed'::enrollment_status ELSE status END,
        completed_at = CASE WHEN ${progress} >= 100 THEN NOW() ELSE completed_at END,
        last_accessed_at = NOW()
      WHERE student_id = ${userId} AND course_id = ${courseId}
    `

    return { data: { progress } }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getInstructorStats(instructorId: string) {
  try {
    const [courses, students, revenue] = await Promise.all([
      sql`SELECT COUNT(*) as n FROM courses WHERE instructor_id = ${instructorId}`,
      sql`SELECT COUNT(*) as n FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ${instructorId}`,
      sql`SELECT COALESCE(SUM(p.amount),0) as total FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.instructor_id = ${instructorId} AND p.status = 'success'`,
    ])
    return {
      total_courses: Number(courses[0]?.n || 0),
      total_students: Number(students[0]?.n || 0),
      total_revenue: Number(revenue[0]?.total || 0),
    }
  } catch {
    return { total_courses: 0, total_students: 0, total_revenue: 0 }
  }
}
