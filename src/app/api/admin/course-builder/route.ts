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
    SELECT c.id, c.title, c.slug, c.status, c.difficulty, c.total_lessons, c.total_students,
      c.price, c.currency, cat.name as category_name
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.created_at DESC
  `
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await request.json()
  const { modules: courseModules, ...courseData } = body
  const slug = courseData.slug || slugify(courseData.title)

  const course = await sql`
    INSERT INTO courses (title, slug, description, short_description, category_id, instructor_id, price, currency,
      duration_weeks, difficulty, status, requirements, what_you_learn, tags, certificate_enabled)
    VALUES (
      ${courseData.title}, ${slug}, ${courseData.description || ''},
      ${courseData.short_description || null}, ${courseData.category_id || null},
      ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'},
      ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
      ${courseData.status || 'draft'}, ${courseData.requirements || []},
      ${courseData.what_you_learn || []}, ${courseData.tags || []},
      ${courseData.certificate_enabled ?? true}
    ) RETURNING *
  `
  const courseId = course[0].id

  if (courseModules?.length) {
    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      if (!mod.title) continue
      const savedMod = await sql`
        INSERT INTO modules (course_id, title, position, is_published)
        VALUES (${courseId}, ${mod.title}, ${mi}, true) RETURNING id
      `
      if (mod.lessons?.length) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (!l.title) continue
          await sql`
            INSERT INTO lessons (module_id, course_id, title, type, video_url, content, position, is_published, is_preview, video_duration)
            VALUES (${savedMod[0].id}, ${courseId}, ${l.title}, ${l.type || 'video'},
              ${l.video_url || null}, ${l.content || null}, ${li}, true,
              ${l.is_preview || false}, ${l.video_duration || 0})
          `
        }
      }
    }
    const count = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${courseId}`
    await sql`UPDATE courses SET total_lessons = ${Number(count[0].n)} WHERE id = ${courseId}`
  }

  return NextResponse.json({ data: course[0] })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { id, modules: courseModules, ...updates } = body

  await sql`
    UPDATE courses SET
      title = COALESCE(${updates.title}, title),
      slug = COALESCE(${updates.slug}, slug),
      description = COALESCE(${updates.description}, description),
      short_description = ${updates.short_description || null},
      category_id = ${updates.category_id || null},
      difficulty = COALESCE(${updates.difficulty}::difficulty_level, difficulty),
      duration_weeks = COALESCE(${updates.duration_weeks}, duration_weeks),
      price = COALESCE(${updates.price}, price),
      currency = COALESCE(${updates.currency}, currency),
      status = COALESCE(${updates.status}::course_status, status),
      requirements = COALESCE(${updates.requirements}, requirements),
      what_you_learn = COALESCE(${updates.what_you_learn}, what_you_learn),
      tags = COALESCE(${updates.tags}, tags),
      certificate_enabled = COALESCE(${updates.certificate_enabled}, certificate_enabled),
      updated_at = NOW()
    WHERE id = ${id}
  `

  if (courseModules?.length) {
    // Delete old modules/lessons and rebuild
    await sql`DELETE FROM lessons WHERE course_id = ${id}`
    await sql`DELETE FROM modules WHERE course_id = ${id}`
    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      if (!mod.title) continue
      const savedMod = await sql`
        INSERT INTO modules (course_id, title, position, is_published)
        VALUES (${id}, ${mod.title}, ${mi}, true) RETURNING id
      `
      if (mod.lessons?.length) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (!l.title) continue
          await sql`
            INSERT INTO lessons (module_id, course_id, title, type, video_url, content, position, is_published, is_preview, video_duration)
            VALUES (${savedMod[0].id}, ${id}, ${l.title}, ${l.type || 'video'},
              ${l.video_url || null}, ${l.content || null}, ${li}, true,
              ${l.is_preview || false}, ${l.video_duration || 0})
          `
        }
      }
    }
    const count = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${id}`
    await sql`UPDATE courses SET total_lessons = ${Number(count[0].n)} WHERE id = ${id}`
  }

  const course = await sql`SELECT * FROM courses WHERE id = ${id} LIMIT 1`
  return NextResponse.json({ data: course[0] })
}
