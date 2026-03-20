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
    SELECT c.id, c.title, c.slug, c.status, c.difficulty, c.total_lessons,
      c.total_students, c.price, c.currency, cat.name as category_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.created_at DESC
  `
  return NextResponse.json({ data })
}

async function saveModules(courseId: string, courseModules: any[]) {
  if (!courseModules?.length) return
  await sql`DELETE FROM lessons WHERE course_id = ${courseId}`
  await sql`DELETE FROM modules WHERE course_id = ${courseId}`

  for (let mi = 0; mi < courseModules.length; mi++) {
    const mod = courseModules[mi]
    if (!mod.title) continue
    const savedMod = await sql`
      INSERT INTO modules (course_id, title, position, is_published)
      VALUES (${courseId}, ${mod.title}, ${mi}, true) RETURNING id
    `
    const modId = savedMod[0].id
    if (mod.lessons?.length) {
      for (let li = 0; li < mod.lessons.length; li++) {
        const l = mod.lessons[li]
        if (!l.title && l.type !== 'text_header') continue
        try {
          await sql`
            INSERT INTO lessons (module_id, course_id, title, type, video_url, external_url,
              file_url, file_name, content, position, is_published, is_preview, video_duration)
            VALUES (${modId}, ${courseId}, ${l.title || ''}, ${l.type || 'video'},
              ${l.video_url || null}, ${l.external_url || null},
              ${l.file_url || null}, ${l.file_name || null},
              ${l.content || null}, ${li}, true,
              ${l.is_preview || false}, ${l.video_duration || 0})
          `
        } catch {
          // Fallback if external_url/file_name columns don't exist yet
          await sql`
            INSERT INTO lessons (module_id, course_id, title, type, video_url,
              file_url, content, position, is_published, is_preview, video_duration)
            VALUES (${modId}, ${courseId}, ${l.title || ''}, ${l.type || 'video'},
              ${l.video_url || l.external_url || null},
              ${l.file_url || null}, ${l.content || null},
              ${li}, true, ${l.is_preview || false}, ${l.video_duration || 0})
          `
        }
      }
    }
  }
  const count = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${courseId}`
  await sql`UPDATE courses SET total_lessons = ${Number(count[0].n)} WHERE id = ${courseId}`
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { modules: courseModules, ...courseData } = await request.json()
  const slug = courseData.slug || slugify(courseData.title)

  const course = await sql`
    INSERT INTO courses (title, slug, description, short_description, category_id,
      instructor_id, price, currency, duration_weeks, difficulty, status,
      requirements, what_you_learn, tags, certificate_enabled)
    VALUES (${courseData.title}, ${slug}, ${courseData.description || ''},
      ${courseData.short_description || null}, ${courseData.category_id || null},
      ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'},
      ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
      ${courseData.status || 'draft'}, ${courseData.requirements || []},
      ${courseData.what_you_learn || []}, ${courseData.tags || []},
      ${courseData.certificate_enabled ?? true})
    RETURNING *
  `
  await saveModules(course[0].id, courseModules)
  return NextResponse.json({ data: course[0] })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, modules: courseModules, ...courseData } = await request.json()

  // Update course — any admin can edit any course
  const course = await sql`
    UPDATE courses SET
      title       = COALESCE(${courseData.title || null}, title),
      slug        = COALESCE(${courseData.slug || null}, slug),
      description = COALESCE(${courseData.description || null}, description),
      short_description = ${courseData.short_description || null},
      category_id = ${courseData.category_id || null},
      difficulty  = COALESCE(${courseData.difficulty || null}::difficulty_level, difficulty),
      duration_weeks = COALESCE(${courseData.duration_weeks || null}, duration_weeks),
      price       = COALESCE(${courseData.price ?? null}, price),
      currency    = COALESCE(${courseData.currency || null}, currency),
      status      = COALESCE(${courseData.status || null}::course_status, status),
      requirements    = COALESCE(${courseData.requirements || null}, requirements),
      what_you_learn  = COALESCE(${courseData.what_you_learn || null}, what_you_learn),
      tags            = COALESCE(${courseData.tags || null}, tags),
      certificate_enabled = COALESCE(${courseData.certificate_enabled ?? null}, certificate_enabled),
      updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (courseModules) await saveModules(id, courseModules)
  return NextResponse.json({ data: course[0] })
}
