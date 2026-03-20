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
    ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
  `
  return NextResponse.json({ data })
}

async function upsertCourse(courseId: string | null, userId: string, body: any) {
  const { modules: courseModules, ...courseData } = body
  const slug = courseData.slug || slugify(courseData.title)

  let course: any[]
  if (courseId) {
    course = await sql`
      UPDATE courses SET
        title = ${courseData.title},
        slug = ${slug},
        description = COALESCE(${courseData.description || null}, description),
        short_description = ${courseData.short_description || null},
        category_id = ${courseData.category_id || null},
        difficulty = ${courseData.difficulty || 'beginner'}::difficulty_level,
        duration_weeks = ${courseData.duration_weeks || 12},
        price = ${courseData.price || 0},
        currency = ${courseData.currency || 'NGN'},
        status = ${courseData.status || 'draft'}::course_status,
        requirements = ${courseData.requirements || []},
        what_you_learn = ${courseData.what_you_learn || []},
        tags = ${courseData.tags || []},
        certificate_enabled = ${courseData.certificate_enabled ?? true},
        updated_at = NOW()
      WHERE id = ${courseId}
      RETURNING *
    `
  } else {
    course = await sql`
      INSERT INTO courses (
        title, slug, description, short_description, category_id, instructor_id,
        price, currency, duration_weeks, difficulty, status,
        requirements, what_you_learn, tags, certificate_enabled
      ) VALUES (
        ${courseData.title}, ${slug}, ${courseData.description || ''},
        ${courseData.short_description || null}, ${courseData.category_id || null}, ${userId},
        ${courseData.price || 0}, ${courseData.currency || 'NGN'},
        ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
        ${courseData.status || 'draft'},
        ${courseData.requirements || []}, ${courseData.what_you_learn || []},
        ${courseData.tags || []}, ${courseData.certificate_enabled ?? true}
      ) RETURNING *
    `
  }

  const cid = course[0].id

  if (courseModules?.length) {
    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      if (!mod.title) continue

      let modId: string
      if (mod.id) {
        // Update existing module
        await sql`UPDATE modules SET title = ${mod.title}, position = ${mi} WHERE id = ${mod.id}`
        modId = mod.id
      } else {
        // Create new module
        const newMod = await sql`
          INSERT INTO modules (course_id, title, position, is_published)
          VALUES (${cid}, ${mod.title}, ${mi}, true)
          RETURNING id
        `
        modId = newMod[0].id
      }

      if (mod.lessons?.length) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (!l.title && l.type !== 'text_header') continue

          if (l.id) {
            // Update existing lesson
            await sql`
              UPDATE lessons SET
                title = ${l.title || ''},
                type = ${l.type || 'video'},
                video_url = ${l.video_url || null},
                external_url = ${l.external_url || null},
                file_url = ${l.file_url || null},
                file_name = ${l.file_name || null},
                content = ${l.content || null},
                position = ${li},
                is_preview = ${l.is_preview || false},
                video_duration = ${l.video_duration || 0}
              WHERE id = ${l.id}
            `
          } else {
            // Create new lesson
            await sql`
              INSERT INTO lessons (
                module_id, course_id, title, type, video_url, external_url,
                file_url, file_name, content, position, is_published,
                is_preview, video_duration
              ) VALUES (
                ${modId}, ${cid}, ${l.title || ''},
                ${l.type || 'video'}, ${l.video_url || null},
                ${l.external_url || null}, ${l.file_url || null},
                ${l.file_name || null}, ${l.content || null},
                ${li}, true, ${l.is_preview || false}, ${l.video_duration || 0}
              )
            `
          }
        }
      }
    }

    // Update lesson count
    const count = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${cid} AND is_published = true`
    await sql`UPDATE courses SET total_lessons = ${Number(count[0].n)} WHERE id = ${cid}`
  }

  return course[0]
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await request.json()
  try {
    const result = await upsertCourse(null, userId, body)
    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error('Course create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { id, ...body } = await request.json()
  try {
    const result = await upsertCourse(id, userId, body)
    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error('Course update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
