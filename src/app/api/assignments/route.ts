export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  const submissions = await sql`
    SELECT * FROM assignment_submissions
    WHERE lesson_id = ${lessonId} AND student_id = ${userId}
    ORDER BY submitted_at DESC LIMIT 5
  `
  return NextResponse.json({ data: submissions })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { lesson_id, course_id, file_url, file_name, file_size, notes } = await request.json()
  if (!lesson_id || !file_url) return NextResponse.json({ error: 'lesson_id and file_url required' }, { status: 400 })

  const sub = await sql`
    INSERT INTO assignment_submissions (lesson_id, course_id, student_id, file_url, file_name, file_size, notes, status)
    VALUES (${lesson_id}, ${course_id || null}, ${userId}, ${file_url}, ${file_name || ''}, ${file_size || null}, ${notes || null}, 'submitted')
    RETURNING *
  `

  // Mark lesson as complete
  try {
    await sql`
      INSERT INTO lesson_progress (student_id, lesson_id, course_id, completed, completed_at)
      VALUES (${userId}, ${lesson_id}, ${course_id}, true, NOW())
      ON CONFLICT (student_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()
    `
  } catch (_) {}

  return NextResponse.json({ data: sub[0] })
}
