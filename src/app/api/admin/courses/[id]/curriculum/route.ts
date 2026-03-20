export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { modules } = await req.json()
  const courseId = params.id

  // Delete existing modules and lessons, then recreate
  await sql`DELETE FROM lessons WHERE course_id = ${courseId}`
  await sql`DELETE FROM modules WHERE course_id = ${courseId}`

  let totalLessons = 0
  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi]
    const savedMod = await sql`
      INSERT INTO modules (course_id, title, position, is_published)
      VALUES (${courseId}, ${mod.title || 'Module ' + (mi+1)}, ${mi}, ${mod.is_published ?? true})
      RETURNING id`
    const modId = savedMod[0].id
    for (let li = 0; li < (mod.lessons || []).length; li++) {
      const l = mod.lessons[li]
      if (!l.title?.trim()) continue
      await sql`
        INSERT INTO lessons (module_id, course_id, title, type, video_url, content, video_duration, position, is_published, is_preview)
        VALUES (${modId}, ${courseId}, ${l.title}, ${l.type || 'video'}, ${l.video_url || null}, ${l.content || null}, ${l.video_duration || null}, ${li}, ${l.is_published ?? true}, ${l.is_preview ?? false})`
      totalLessons++
    }
  }
  await sql`UPDATE courses SET total_lessons = ${totalLessons}, updated_at = NOW() WHERE id = ${courseId}`
  return NextResponse.json({ success: true })
}
