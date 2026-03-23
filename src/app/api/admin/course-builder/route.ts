export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/utils'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

function dbType(type: string): string {
  const map: Record<string, string> = {
    'text_header': 'text', 'page': 'text', 'video': 'video',
    'file': 'text', 'url': 'text', 'quiz': 'quiz',
    'assignment': 'assignment', 'survey': 'text', 'live': 'live',
  }
  return map[type] || 'text'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await sql`
    SELECT c.id, c.title, c.slug, c.status, c.difficulty, c.total_lessons,
      c.total_students, c.price, c.currency, cat.name as category_name
    FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.created_at DESC
  `
  return NextResponse.json({ data })
}

async function upsertCourseWithModules(courseId: string | null, userId: string, body: any) {
  const { modules: courseModules, ...courseData } = body

  // Handle slug uniqueness
  let slug = courseData.slug || slugify(courseData.title)
  if (!courseId) {
    const existing = await sql`SELECT id FROM courses WHERE slug = ${slug} LIMIT 1`
    if (existing[0]) slug = `${slug}-${Date.now().toString().slice(-4)}`
  }

  let course: any[]
  if (courseId) {
    course = await sql`
      UPDATE courses SET
        title = COALESCE(${courseData.title}, title),
        slug = COALESCE(${slug}, slug),
        description = ${courseData.description || ''},
        short_description = ${courseData.short_description || null},
        category_id = ${courseData.category_id || null},
        difficulty = COALESCE(${courseData.difficulty}::difficulty_level, difficulty),
        duration_weeks = COALESCE(${courseData.duration_weeks}, duration_weeks),
        price = COALESCE(${courseData.price}, price),
        currency = COALESCE(${courseData.currency}, currency),
        status = COALESCE(${courseData.status}::course_status, status),
        requirements = COALESCE(${courseData.requirements || null}, requirements),
        what_you_learn = COALESCE(${courseData.what_you_learn || null}, what_you_learn),
        tags = COALESCE(${courseData.tags || null}, tags),
        certificate_enabled = COALESCE(${courseData.certificate_enabled}, certificate_enabled),
        updated_at = NOW()
      WHERE id = ${courseId} RETURNING *
    `
  } else {
    course = await sql`
      INSERT INTO courses (
        title, slug, description, short_description, category_id, instructor_id,
        price, currency, duration_weeks, difficulty, status,
        requirements, what_you_learn, tags, certificate_enabled
      ) VALUES (
        ${courseData.title}, ${slug}, ${courseData.description || ''},
        ${courseData.short_description || null}, ${courseData.category_id || null},
        ${userId}, ${courseData.price || 0}, ${courseData.currency || 'NGN'},
        ${courseData.duration_weeks || 12}, ${courseData.difficulty || 'beginner'},
        ${courseData.status || 'draft'}, ${courseData.requirements || []},
        ${courseData.what_you_learn || []}, ${courseData.tags || []},
        ${courseData.certificate_enabled ?? true}
      ) RETURNING *
    `
  }

  const cid = course[0].id

  if (courseModules?.length) {
    const processedModIds: string[] = []

    for (let mi = 0; mi < courseModules.length; mi++) {
      const mod = courseModules[mi]
      if (!mod.title) continue

      // UPSERT module
      let modId: string
      if (mod.id) {
        await sql`UPDATE modules SET title = ${mod.title}, position = ${mi} WHERE id = ${mod.id}`
        modId = mod.id
        processedModIds.push(modId)
      } else {
        const savedMod = await sql`
          INSERT INTO modules (course_id, title, position, is_published)
          VALUES (${cid}, ${mod.title}, ${mi}, true) RETURNING id
        `
        modId = savedMod[0].id
        processedModIds.push(modId)
      }

      if (mod.lessons?.length) {
        const processedLessonIds: string[] = []

        for (let li = 0; li < mod.lessons.length; li++) {
          const l = mod.lessons[li]
          if (!l.title && l.type !== 'text_header') continue

          const lessonDbType = dbType(l.type || 'text')
          let storedContent = l.content || null
          if (['text_header', 'page', 'file', 'url', 'survey'].includes(l.type)) {
            storedContent = `__type:${l.type}__` + (l.content || '')
          }

          if (l.id) {
            // UPDATE existing lesson — keeps the same ID so quiz links remain intact
            processedLessonIds.push(l.id)
            try {
              await sql`
                UPDATE lessons SET
                  title = ${l.title || ''}, type = ${lessonDbType}::lesson_type,
                  video_url = ${l.video_url || null},
                  content = ${storedContent}, position = ${li},
                  is_preview = ${l.is_preview || false},
                  video_duration = ${l.video_duration || 0},
                  module_id = ${modId}
                WHERE id = ${l.id}
              `
              // Try updating new columns separately (may not exist in DB yet)
              try {
                await sql`
                  UPDATE lessons SET
                    external_url = ${l.external_url || null},
                    file_url = ${l.file_url || null},
                    file_name = ${l.file_name || null}
                  WHERE id = ${l.id}
                `
              } catch (_) { /* columns may not exist yet */ }
            } catch (e: any) {
              console.error('Lesson update error:', e.message)
            }
          } else {
            // INSERT new lesson
            let newId: string | null = null
            try {
              const inserted = await sql`
                INSERT INTO lessons (
                  module_id, course_id, title, type,
                  video_url, external_url, file_url, file_name,
                  content, position, is_published, is_preview, video_duration
                ) VALUES (
                  ${modId}, ${cid}, ${l.title || ''}, ${lessonDbType}::lesson_type,
                  ${l.video_url || null}, ${l.external_url || null},
                  ${l.file_url || null}, ${l.file_name || null},
                  ${storedContent}, ${li}, true,
                  ${l.is_preview || false}, ${l.video_duration || 0}
                ) RETURNING id
              `
              newId = inserted[0].id
            } catch (e: any) {
              console.error('Lesson insert error (trying fallback):', e.message)
              try {
                const inserted = await sql`
                  INSERT INTO lessons (module_id, course_id, title, type, video_url, content, position, is_published, is_preview, video_duration)
                  VALUES (${modId}, ${cid}, ${l.title || ''}, ${lessonDbType}::lesson_type, ${l.video_url || null}, ${storedContent}, ${li}, true, ${l.is_preview || false}, ${l.video_duration || 0})
                  RETURNING id
                `
                newId = inserted[0].id
              } catch (e2: any) {
                console.error('Lesson fallback insert error:', e2.message)
              }
            }
            if (newId) processedLessonIds.push(newId)
          }
        }

        // Delete only lessons that were explicitly removed (not just re-ordered)
        if (processedLessonIds.length > 0) {
          const existingLessons = await sql`SELECT id FROM lessons WHERE module_id = ${modId}`
          const toDelete = existingLessons
            .map((r: any) => r.id)
            .filter((id: string) => !processedLessonIds.includes(id))
          for (const delId of toDelete) {
            await sql`DELETE FROM lessons WHERE id = ${delId}`
          }
        }
      }
    }

    // Delete modules removed by admin
    if (processedModIds.length > 0) {
      const existingMods = await sql`SELECT id FROM modules WHERE course_id = ${cid}`
      const toDelete = existingMods
        .map((r: any) => r.id)
        .filter((id: string) => !processedModIds.includes(id))
      for (const delId of toDelete) {
        await sql`DELETE FROM lessons WHERE module_id = ${delId}`
        await sql`DELETE FROM modules WHERE id = ${delId}`
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
  try {
    const body = await request.json()
    if (!body.title?.trim()) return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
    const result = await upsertCourseWithModules(null, userId, body)
    return NextResponse.json({ data: result })
  } catch (e: any) {
    console.error('Course builder POST error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const { id, ...body } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const result = await upsertCourseWithModules(id, userId, body)
    return NextResponse.json({ data: result })
  } catch (e: any) {
    console.error('Course builder PUT error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  await sql`UPDATE courses SET status = ${status}::course_status WHERE id = ${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sql`DELETE FROM enrollments WHERE course_id = ${id}`
  await sql`DELETE FROM lesson_progress WHERE course_id = ${id}`
  await sql`DELETE FROM lessons WHERE course_id = ${id}`
  await sql`DELETE FROM modules WHERE course_id = ${id}`
  await sql`DELETE FROM courses WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
