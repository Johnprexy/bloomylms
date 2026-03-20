export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/utils'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await sql`
    SELECT c.id, c.title, c.slug, c.status, c.difficulty, c.total_lessons, c.total_students, c.price, c.currency, cat.name as category_name
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.created_at DESC
  `
  return NextResponse.json({ data })
}

async function upsertCourseWithModules(courseId: string | null, userId: string, body: any) {
  const { modules: courseModules, ...courseData } = body
  const slug = courseData.slug || slugify(courseData.title)

  let course: any[]
  if (courseId) {
    course = await sql`
      UPDATE courses SET
        title = COALESCE(${courseData.title}, title),
        slug = COALESCE(${slug}, slug),
        description = COALESCE(${courseData.description}, description),
        short_description = ${courseData.short_description || null},
        category_id = ${courseData.category_id || null},
        difficulty = COALESCE(${courseData.difficulty}::difficulty_level, difficulty),
        duration_weeks = COALESCE(${courseData.duration_weeks}, duration_weeks),
        price = COALESCE(${courseData.price}, price),
        currency = COALESCE(${courseData.currency}, currency),
        status = COALESCE(${courseData.status}::course_status, status),
        requirements = COALESCE(${courseData.requirements}, requirements),
        what_you_learn = COALESCE(${courseData.what_you_learn}, what_you_learn),
        tags = COALESCE(${courseData.tags}, tags),
        certificate_enabled = COALESCE(${courseData.certificate_enabled}, certificate_enabled),
        updated_at = NOW()
      WHERE id = ${courseId} RETURNING *
    `
  } else {
    course = await sql`
      INSERT INTO courses (title, slug, description, short_description, category_id, instructor_id, price, currency,
        duration_weeks, difficulty, status, requirements, what_you_learn, tags, certificate_enabled)
      VALUES (${courseData.title}, ${slug}, ${courseData.description || ''}, ${courseData.short_description || null},
        ${courseData.category_id || null}, ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'},
        ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
        ${courseData.status || 'draft'}, ${courseData.requirements || []}, ${courseData.what_you_learn || []},
        ${courseData.tags || []}, ${courseData.certificate_enabled ?? true})
      RETURNING *
    `
  }

  const cid = course[0].id

  if (courseModules?.length) {
    // Rebuild modules + lessons
    await sql`DELETE FROM lessons WHERE course_id = ${cid}`
    await sql`DELETE FROM modules WHERE course_id = ${cid}`

    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      if (!mod.title) continue
      const savedMod = await sql`
        INSERT INTO modules (course_id, title, position, is_published)
        VALUES (${cid}, ${mod.title}, ${mi}, true) RETURNING id
      `
      const modId = savedMod[0].id

      // Handle prerequisites
      if (mod.prerequisite_module_index !== null && mod.prerequisite_module_index !== undefined && mi > 0) {
        // Store as description temporarily — proper prereq table needs module IDs after insert
        // We'll wire up a second pass after all modules are created
      }

      if (mod.lessons?.length) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (!l.title && l.type !== 'text_header') continue
          await sql`
            INSERT INTO lessons (module_id, course_id, title, type, video_url, external_url, file_url, file_name,
              content, position, is_published, is_preview, video_duration)
            VALUES (${modId}, ${cid}, ${l.title || ''}, ${l.type || 'video'},
              ${l.video_url || null}, ${l.external_url || null}, ${l.file_url || null},
              ${l.file_name || null}, ${l.content || null},
              ${li}, true, ${l.is_preview || false}, ${l.video_duration || 0})
          `
        }
      }
    }

    const count = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${cid}`
    await sql`UPDATE courses SET total_lessons = ${Number(count[0].n)} WHERE id = ${cid}`
  }

  return course[0]
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await request.json()
  const result = await upsertCourseWithModules(null, userId, body)
  return NextResponse.json({ data: result })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { id, ...body } = await request.json()
  const result = await upsertCourseWithModules(id, userId, body)
  return NextResponse.json({ data: result })
}
