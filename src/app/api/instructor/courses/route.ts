export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await request.json()
  const { modules: courseModules, ...courseData } = body
  const slug = courseData.slug || slugify(courseData.title)
  
  const course = await sql`
    INSERT INTO courses (title, slug, description, short_description, category_id, instructor_id, price, currency, duration_weeks, difficulty, status, requirements, what_you_learn, tags, certificate_enabled)
    VALUES (${courseData.title}, ${slug}, ${courseData.description || ''}, ${courseData.short_description || null}, ${courseData.category_id || null}, ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'}, ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'}, 'draft', ${courseData.requirements || []}, ${courseData.what_you_learn || []}, ${courseData.tags || []}, true)
    RETURNING *
  `
  const courseId = course[0].id

  if (courseModules?.length) {
    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      const savedMod = await sql`INSERT INTO modules (course_id, title, position, is_published) VALUES (${courseId}, ${mod.title}, ${mi}, true) RETURNING id`
      if (mod.lessons?.length) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (l.title) await sql`INSERT INTO lessons (module_id, course_id, title, type, video_url, position, is_published) VALUES (${savedMod[0].id}, ${courseId}, ${l.title}, ${l.type || 'video'}, ${l.content || null}, ${li}, true)`
        }
      }
    }
  }
  return NextResponse.json({ data: course[0] })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status, ...updates } = await request.json()
  const course = await sql`UPDATE courses SET status = COALESCE(${status}::course_status, status), updated_at = NOW() WHERE id = ${id} RETURNING *`
  return NextResponse.json({ data: course[0] })
}
