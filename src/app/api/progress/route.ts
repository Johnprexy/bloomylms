export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { lesson_id, course_id, completed, watch_time_seconds } = await request.json()
  await sql`
    INSERT INTO lesson_progress (student_id, lesson_id, course_id, completed, watch_time_seconds, completed_at)
    VALUES (${userId}, ${lesson_id}, ${course_id}, ${completed ?? false}, ${watch_time_seconds ?? 0}, ${completed ? new Date().toISOString() : null})
    ON CONFLICT (student_id, lesson_id) DO UPDATE SET
      completed = EXCLUDED.completed, watch_time_seconds = EXCLUDED.watch_time_seconds,
      completed_at = EXCLUDED.completed_at
  `
  const total = await sql`SELECT COUNT(*) as n FROM lessons WHERE course_id = ${course_id} AND is_published = true`
  const done = await sql`SELECT COUNT(*) as n FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id WHERE lp.student_id = ${userId} AND l.course_id = ${course_id} AND lp.completed = true`
  const progress = Number(total[0]?.n) > 0 ? Math.round((Number(done[0]?.n) / Number(total[0]?.n)) * 100) : 0
  await sql`UPDATE enrollments SET progress_percent = ${progress}, last_accessed_at = NOW(), status = CASE WHEN ${progress} >= 100 THEN 'completed'::enrollment_status ELSE status END, completed_at = CASE WHEN ${progress} >= 100 THEN NOW() ELSE completed_at END WHERE student_id = ${userId} AND course_id = ${course_id}`
  return NextResponse.json({ data: { progress } })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  const data = await sql`SELECT * FROM lesson_progress WHERE student_id = ${userId} AND course_id = ${course_id}`
  return NextResponse.json({ data })
}
