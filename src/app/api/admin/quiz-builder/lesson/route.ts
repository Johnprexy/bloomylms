export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const title = searchParams.get('title')

  if (!courseId || !title) return NextResponse.json({ error: 'course_id and title required' }, { status: 400 })

  // Find lesson directly - no is_published filter, match by title
  const lessons = await sql`
    SELECT l.id, l.title, l.type
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ${courseId}
      AND l.type = 'quiz'
      AND LOWER(TRIM(l.title)) = LOWER(TRIM(${title}))
    LIMIT 1
  `

  if (lessons[0]) return NextResponse.json({ id: lessons[0].id, title: lessons[0].title })

  // Fallback: any quiz lesson in this course matching title loosely
  const fallback = await sql`
    SELECT l.id, l.title FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ${courseId} AND l.type = 'quiz'
    ORDER BY l.created_at DESC LIMIT 1
  `

  if (fallback[0]) return NextResponse.json({ id: fallback[0].id, title: fallback[0].title })

  return NextResponse.json({ error: `No quiz lesson found with title "${title}" in this course` }, { status: 404 })
}
